import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import round1Questions from './src/data/round1Questions.js';
import round2Questions from './src/data/round2Questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));

const DEFAULT_GAME_STATE = {
  currentRound: 0,
  currentQuestion: -1,
  questionActive: false,
  questionStartTime: 0,
  questionEndsAt: 0,
  revealed: false,
  revealMode: false,
  showLeaderboard: false,
  leaderboard: { visible: false, rows: [], round: '' },
  round1Complete: false,
  round2Complete: false,
  gameOver: false,
  r1QualifyPercent: 80,
  r2QualifyPercent: 60,
  r1TimerDuration: 10,
  r2TimerDuration: 45,
  currentQuestionData: null,
  currentCorrectAnswer: null,
  currentExplanation: null,
  currentWhyText: null,
  currentFixText: null,
};

let gameState = { ...DEFAULT_GAME_STATE };
let teams = {};

let questionTimer = null;

const STATE_FILE = path.join(__dirname, 'gameState.json');
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ gameState, teams }, null, 2));
  } catch(e) {
    console.error('Failed to save state', e);
  }
}

let serverStartupMode = process.env.RESUME === '1' ? 'resume' : 'prompt';
let pendingRecoveryData = null;

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const stats = fs.statSync(STATE_FILE);
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      
      if (serverStartupMode === 'resume' || ageHours < 6) {
        gameState = { ...DEFAULT_GAME_STATE, ...(data.gameState || {}) };
        teams = data.teams || teams;
        
        // Validate team qualification flags
        for (const tId in teams) {
          const t = teams[tId];
          if (t.qualifiedR2 === undefined) t.qualifiedR2 = t.qualifiedRound2 ?? false;
          if (t.qualifiedFinal === undefined) t.qualifiedFinal = t.qualifiedRound3 ?? false;
          if (t.kicked === undefined) t.kicked = t.eliminated ?? false;
        }

        console.log('Restored state automatically.');

        // Re-arm timer if server restarted mid-timer!
        if (gameState.questionActive && gameState.questionEndsAt) {
          const remain = gameState.questionEndsAt - Date.now();
          if (remain <= 0) {
            console.log('Timer expired while server was offline. Revealing immediately.');
            setTimeout(() => { triggerReveal(); }, 100);
          } else {
            console.log(`Re-arming question timer for remaining ${remain}ms.`);
            questionTimer = setTimeout(() => {
              triggerReveal();
            }, remain);
          }
        }
      } else {
        pendingRecoveryData = data;
        gameState.recoveryMode = true;
        console.log('State is old, pending host recovery decision.');
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
  }
}
loadState();

function getPublicGameState() {
  const publicState = { ...gameState };
  if (!publicState.revealed) {
    publicState.currentCorrectAnswer = null;
    publicState.currentExplanation = null;
    publicState.currentWhyText = null;
    publicState.currentFixText = null;
  }
  return publicState;
}

function broadcastState() {
  io.emit('sync_state', {
    gameState: getPublicGameState(),
    teams,
    serverNow: Date.now()
  });
}

function triggerReveal() {
  if (questionTimer) {
    clearTimeout(questionTimer);
    questionTimer = null;
  }

  if (!gameState.questionActive && gameState.revealed) return; // already revealed

  gameState.questionActive = false;
  gameState.revealed = true;
  gameState.revealMode = true;

  const r = gameState.currentRound;
  const qIdx = gameState.currentQuestion;

  let correctAns = null;
  let explanation = null;
  let whyText = null;
  let fixText = null;

  if (r === 1 && qIdx >= 0 && qIdx < round1Questions.length) {
    const q = round1Questions[qIdx];
    correctAns = q.answer;
    explanation = q.explanation;
  } else if (r === 2 && qIdx >= 0 && qIdx < round2Questions.length) {
    const q = round2Questions[qIdx];
    correctAns = q.correctAnswer;
    explanation = q.explanation || '';
    whyText = q.whyText || '';
    fixText = q.fixText || '';
  }

  gameState.currentCorrectAnswer = correctAns;
  gameState.currentExplanation = explanation;
  gameState.currentWhyText = whyText;
  gameState.currentFixText = fixText;

  const answerKey = `r${r}_${qIdx}`;
  const now = Date.now();

  for (const [tId, t] of Object.entries(teams)) {
    // Only process non-kicked, qualified teams for this round
    if (t.kicked) continue;
    if (r === 2 && !t.qualifiedR2) continue;
    if (r === 3 && !t.qualifiedFinal) continue;

    if (!t.answers) t.answers = {};
    const ansData = t.answers[answerKey];

    // Auto-submit draft if not submitted yet
    if (ansData && !ansData.submitted && ansData.draft) {
      ansData.answer = ansData.draft;
      ansData.submitted = true;
      ansData.responseTime = ansData.draftTimestamp ? Math.max(10, ansData.draftTimestamp - gameState.questionStartTime) : (gameState.questionEndsAt - gameState.questionStartTime);
    } else if (!ansData || !ansData.submitted) {
      t.answers[answerKey] = {
        answer: null,
        submitted: true,
        responseTime: gameState.questionEndsAt ? (gameState.questionEndsAt - gameState.questionStartTime) : 45000
      };
    }

    const curAns = t.answers[answerKey];
    const userPick = curAns.answer;
    const isCorrect = userPick !== null && userPick === correctAns;
    curAns.correct = isCorrect;

    let points = 0;
    if (r === 1) {
      if (userPick === null) points = 0;
      else if (isCorrect) points = 10;
      else points = -5;
      curAns.points = points;
      t.round1Score = (t.round1Score || 0) + points;
    } else if (r === 2) {
      if (isCorrect) points = 10;
      else points = 0;
      curAns.points = points;
      t.round2Score = (t.round2Score || 0) + points;
    }

    t.totalScore = (t.round1Score || 0) + (t.round2Score || 0);
    if (isCorrect && curAns.responseTime) {
      t.totalResponseTime = (t.totalResponseTime || 0) + curAns.responseTime;
    }
  }

  broadcastState();
  saveState();
}

io.on('connection', (socket) => {
  socket.emit('sync_state', {
    gameState: getPublicGameState(),
    teams,
    serverNow: Date.now()
  });

  socket.on('get_initial_state', () => {
    socket.emit('sync_state', {
      gameState: getPublicGameState(),
      teams,
      serverNow: Date.now()
    });
  });

  // ===================== HOST ACTIONS =====================

  socket.on('host:update_settings', ({ r1QualifyPercent, r2QualifyPercent, r1TimerDuration, r2TimerDuration }) => {
    if (r1QualifyPercent !== undefined) gameState.r1QualifyPercent = Math.max(1, Math.min(100, Number(r1QualifyPercent)));
    if (r2QualifyPercent !== undefined) gameState.r2QualifyPercent = Math.max(1, Math.min(100, Number(r2QualifyPercent)));
    if (r1TimerDuration !== undefined) gameState.r1TimerDuration = Math.max(5, Math.min(180, Number(r1TimerDuration)));
    if (r2TimerDuration !== undefined) gameState.r2TimerDuration = Math.max(5, Math.min(180, Number(r2TimerDuration)));
    broadcastState();
    saveState();
  });

  socket.on('host:set_round', (roundNumber) => {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }

    gameState = {
      ...gameState,
      currentRound: roundNumber,
      currentQuestion: -1,
      questionActive: false,
      questionStartTime: 0,
      questionEndsAt: 0,
      revealed: false,
      revealMode: false,
      currentQuestionData: null,
      currentCorrectAnswer: null,
      currentExplanation: null,
      currentWhyText: null,
      currentFixText: null,
      showLeaderboard: false
    };
    broadcastState();
    saveState();
  });

  socket.on('host:start_question', () => {
    // Idempotent guard: if timer is active, ignore double-click
    if (gameState.questionActive) return;

    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }

    const nextQ = gameState.currentQuestion + 1;
    const r = gameState.currentRound;

    const maxQ = r === 1 ? round1Questions.length : round2Questions.length;
    if (nextQ >= maxQ) return;

    let qData = null;
    if (r === 1) {
      const q = round1Questions[nextQ];
      qData = {
        id: q.id,
        statement: q.statement,
        category: q.category
      };
    } else if (r === 2) {
      const q = round2Questions[nextQ];
      qData = {
        id: q.id,
        title: q.title,
        category: q.category,
        scenarioDescription: q.scenarioDescription,
        image: q.image,
        question: q.question,
        options: q.options
      };
    }

    const durationSecs = r === 1
      ? (gameState.r1TimerDuration || 10)
      : (gameState.r2TimerDuration || 45);
    const durationMs = durationSecs * 1000;
    const now = Date.now();

    gameState.currentQuestion = nextQ;
    gameState.questionActive = true;
    gameState.questionStartTime = now;
    gameState.questionEndsAt = now + durationMs;
    gameState.revealed = false;
    gameState.revealMode = false;
    gameState.currentQuestionData = qData;
    gameState.currentCorrectAnswer = null;
    gameState.currentExplanation = null;
    gameState.currentWhyText = null;
    gameState.currentFixText = null;

    // Reset drafts for this question
    const answerKey = `r${r}_${nextQ}`;
    for (const tId in teams) {
      if (teams[tId].answers && teams[tId].answers[answerKey]) {
        delete teams[tId].answers[answerKey];
      }
    }

    // Arm server timer
    questionTimer = setTimeout(() => {
      triggerReveal();
    }, durationMs);

    broadcastState();
    saveState();
  });

  socket.on('host:advance_waiting', () => {
    // Only allowed if revealed!
    if (!gameState.revealed) return;

    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }

    gameState.questionActive = false;
    gameState.revealed = false;
    gameState.revealMode = false;
    gameState.questionStartTime = 0;
    gameState.questionEndsAt = 0;
    gameState.currentQuestionData = null;
    gameState.currentCorrectAnswer = null;
    gameState.currentExplanation = null;
    gameState.currentWhyText = null;
    gameState.currentFixText = null;

    broadcastState();
    saveState();
  });

  socket.on('host:reveal_now', () => {
    if (gameState.questionActive) {
      triggerReveal();
    }
  });

  socket.on('host:end_round_confirm', ({ roundNumber }) => {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }

    if (roundNumber === 1) {
      gameState.round1Complete = true;
      gameState.questionActive = false;
      gameState.revealed = false;
      gameState.revealMode = false;
      gameState.currentQuestion = -1;
      gameState.currentQuestionData = null;

      // TOP 80% (or r1QualifyPercent) of non-kicked registered teams
      const nonKicked = Object.entries(teams).filter(([id, t]) => !t.kicked).map(([id, t]) => ({ id, ...t }));
      const N = nonKicked.length;
      const pct = gameState.r1QualifyPercent || 80;
      const qualifiedTargetCount = Math.max(1, Math.ceil(N * pct / 100));

      nonKicked.sort((a, b) => {
        const sA = a.round1Score ?? 0;
        const sB = b.round1Score ?? 0;
        if (sB !== sA) return sB - sA;
        return (a.totalResponseTime || Infinity) - (b.totalResponseTime || Infinity);
      });

      // Rank assignment
      nonKicked.forEach((team, idx) => {
        teams[team.id].r1Rank = idx + 1;
        teams[team.id].r1TotalTeams = N;
      });

      let cutoffScore = 0;
      let cutoffTime = Infinity;
      if (nonKicked.length > 0) {
        const cutoffTeam = nonKicked[Math.min(qualifiedTargetCount - 1, nonKicked.length - 1)];
        cutoffScore = cutoffTeam.round1Score ?? 0;
        cutoffTime = cutoffTeam.totalResponseTime || Infinity;
      }

      nonKicked.forEach((team, idx) => {
        const tScore = team.round1Score ?? 0;
        const tTime = team.totalResponseTime || Infinity;
        const isCutoffTie = (tScore === cutoffScore && tTime === cutoffTime);
        const isQual = idx < qualifiedTargetCount || isCutoffTie;

        teams[team.id].qualifiedR2 = isQual;
        teams[team.id].qualifiedRound2 = isQual;
      });

      gameState.qualifiedTeams = nonKicked.filter(t => teams[t.id].qualifiedR2).map(t => t.id);

    } else if (roundNumber === 2) {
      gameState.round2Complete = true;
      gameState.questionActive = false;
      gameState.revealed = false;
      gameState.revealMode = false;
      gameState.currentQuestion = -1;
      gameState.currentQuestionData = null;
      gameState.gameOver = true;

      // TOP 60% of teams that played Round 2 (qualifiedR2 and !kicked)
      const r2Teams = Object.entries(teams)
        .filter(([id, t]) => !t.kicked && t.qualifiedR2)
        .map(([id, t]) => ({ id, ...t }));

      const N = r2Teams.length;
      const pct = gameState.r2QualifyPercent || 60;
      const qualifiedTargetCount = Math.max(1, Math.ceil(N * pct / 100));

      r2Teams.sort((a, b) => {
        const sA = a.totalScore ?? ((a.round1Score || 0) + (a.round2Score || 0));
        const sB = b.totalScore ?? ((b.round1Score || 0) + (b.round2Score || 0));
        if (sB !== sA) return sB - sA;
        return (a.totalResponseTime || Infinity) - (b.totalResponseTime || Infinity);
      });

      r2Teams.forEach((team, idx) => {
        teams[team.id].r2Rank = idx + 1;
        teams[team.id].r2TotalTeams = N;
      });

      let cutoffScore = 0;
      let cutoffTime = Infinity;
      if (r2Teams.length > 0) {
        const cutoffTeam = r2Teams[Math.min(qualifiedTargetCount - 1, r2Teams.length - 1)];
        cutoffScore = cutoffTeam.totalScore ?? 0;
        cutoffTime = cutoffTeam.totalResponseTime || Infinity;
      }

      r2Teams.forEach((team, idx) => {
        const tScore = team.totalScore ?? 0;
        const tTime = team.totalResponseTime || Infinity;
        const isCutoffTie = (tScore === cutoffScore && tTime === cutoffTime);
        const isQual = idx < qualifiedTargetCount || isCutoffTie;

        teams[team.id].qualifiedFinal = isQual;
        teams[team.id].qualifiedRound3 = isQual;
      });
    }

    broadcastState();
    saveState();
  });

  socket.on('host:broadcast_leaderboard', () => {
    // build rows from teams
    const allTeams = Object.entries(teams)
      .filter(([id, t]) => !t.kicked)
      .map(([id, t]) => ({ id, ...t }));

    // Sort by Total Score, then Total Response Time
    allTeams.sort((a, b) => {
      const sA = a.totalScore ?? ((a.round1Score || 0) + (a.round2Score || 0));
      const sB = b.totalScore ?? ((b.round1Score || 0) + (b.round2Score || 0));
      if (sB !== sA) return sB - sA;
      return (a.totalResponseTime || Infinity) - (b.totalResponseTime || Infinity);
    });

    // Assign rank
    allTeams.forEach((t, idx) => {
      t.computedRank = idx + 1;
    });

    gameState.leaderboard = {
      visible: true,
      rows: allTeams,
      round: `Round ${gameState.currentRound || 1}`
    };
    gameState.showLeaderboard = true;
    broadcastState();
    saveState();
  });

  socket.on('host:hide_leaderboard', () => {
    if (gameState.leaderboard) {
      gameState.leaderboard.visible = false;
    }
    gameState.showLeaderboard = false;
    broadcastState();
    saveState();
  });

  socket.on('host:toggle_leaderboard', (show) => {
    if (show) {
      // Trigger the broadcast
      // This is a fallback if UI still uses toggle_leaderboard
      const allTeams = Object.entries(teams).filter(([id, t]) => !t.kicked).map(([id, t]) => ({ id, ...t }));
      allTeams.sort((a, b) => {
        const sA = a.totalScore ?? ((a.round1Score || 0) + (a.round2Score || 0));
        const sB = b.totalScore ?? ((b.round1Score || 0) + (b.round2Score || 0));
        if (sB !== sA) return sB - sA;
        return (a.totalResponseTime || Infinity) - (b.totalResponseTime || Infinity);
      });
      allTeams.forEach((t, idx) => { t.computedRank = idx + 1; });
      gameState.leaderboard = { visible: true, rows: allTeams, round: `Round ${gameState.currentRound || 1}` };
    } else {
      if (gameState.leaderboard) gameState.leaderboard.visible = false;
    }
    gameState.showLeaderboard = show;
    broadcastState();
    saveState();
  });

  socket.on('host:reset_game', () => {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    gameState = { ...DEFAULT_GAME_STATE };
    teams = {};
    pendingRecoveryData = null;
    io.emit('game_reset');
    broadcastState();
    saveState();
  });

  socket.on('host:remove_team', ({ teamName, teamId }) => {
    const targetId = teamId || Object.keys(teams).find(k => teams[k].name === teamName);
    if (targetId && teams[targetId]) {
      teams[targetId].kicked = true;
      teams[targetId].eliminated = true;
    }
    io.emit('team_kicked', { teamName, teamId: targetId });
    broadcastState();
    saveState();
  });

  socket.on('host:restore_team', ({ teamId }) => {
    if (teams[teamId]) {
      teams[teamId].kicked = false;
      teams[teamId].eliminated = false;
      if (gameState.currentRound === 1 || gameState.currentRound === 2) {
        teams[teamId].qualifiedR2 = true;
        teams[teamId].qualifiedRound2 = true;
      }
      if (gameState.currentRound === 3) {
        teams[teamId].qualifiedFinal = true;
        teams[teamId].qualifiedRound3 = true;
      }
      broadcastState();
      saveState();
    }
  });

  socket.on('host:force_clear_teams', () => {
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    teams = {};
    gameState.currentRound = 0;
    io.emit('game_reset');
    broadcastState();
    saveState();
  });

  // ===================== PARTICIPANT ACTIONS =====================

  socket.on('participant:register', ({ teamName, members }, callback) => {
    if (gameState.currentRound !== 0) {
      const existingTeam = Object.entries(teams).find(([id, t]) => t.name.toLowerCase() === teamName.toLowerCase());
      if (existingTeam) {
        if (existingTeam[1].kicked) {
          return callback({ error: 'Team has been removed by the host.' });
        }
        return callback({ success: true, teamId: existingTeam[0] });
      }
      return callback({ error: 'Registration is closed. Round 1 has already started.' });
    }

    const isDuplicate = Object.values(teams).some(
      t => t.name.toLowerCase() === teamName.toLowerCase()
    );
    if (isDuplicate) {
      return callback({ error: 'Team name already taken!' });
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    teams[teamId] = {
      name: teamName,
      members: members || [],
      joinedAt: Date.now(),
      round1Score: 0,
      round2Score: 0,
      totalScore: 0,
      totalResponseTime: 0,
      qualifiedR2: false,
      qualifiedRound2: false,
      qualifiedFinal: false,
      qualifiedRound3: false,
      kicked: false,
      eliminated: false,
      answers: {}
    };

    broadcastState();
    saveState();
    callback({ success: true, teamId });
  });

  socket.on('participant:select_answer', ({ teamId, roundNumber, questionIndex, answer }) => {
    if (!teams[teamId]) return;
    const t = teams[teamId];
    if (t.kicked) return;
    if (roundNumber === 2 && !t.qualifiedR2) return;
    if (roundNumber === 3 && !t.qualifiedFinal) return;

    if (!gameState.questionActive || gameState.revealed) return;
    if (gameState.currentRound !== roundNumber || gameState.currentQuestion !== questionIndex) return;

    const answerKey = `r${roundNumber}_${questionIndex}`;
    if (!t.answers) t.answers = {};
    if (!t.answers[answerKey]) t.answers[answerKey] = {};

    if (t.answers[answerKey].submitted) return;

    t.answers[answerKey].draft = answer;
    t.answers[answerKey].draftTimestamp = Date.now();

    // R1 now behaves identically to R2 (draft mode)

    saveState();
    broadcastState();
  });

  socket.on('participant:draft_answer', ({ teamId, questionIndex, draftKey }) => {
    if (!teams[teamId]) return;
    const t = teams[teamId];
    if (t.kicked) return;
    if (gameState.currentRound === 2 && !t.qualifiedR2) return;

    if (!gameState.questionActive || gameState.revealed) return;
    const answerKey = `r${gameState.currentRound}_${questionIndex}`;
    if (!t.answers) t.answers = {};
    if (!t.answers[answerKey]) t.answers[answerKey] = {};

    if (t.answers[answerKey].submitted) return;

    t.answers[answerKey].draft = draftKey;
    t.answers[answerKey].draftTimestamp = Date.now();
    saveState();
    broadcastState();
  });

  socket.on('participant:submit_answer', ({ teamId, roundNumber, questionIndex, answer }, callback) => {
    if (!teams[teamId]) {
      if (typeof callback === 'function') callback({ error: 'Team not found' });
      return;
    }
    const t = teams[teamId];
    if (t.kicked) {
      if (typeof callback === 'function') callback({ error: 'Team kicked' });
      return;
    }
    if (roundNumber === 2 && !t.qualifiedR2) {
      if (typeof callback === 'function') callback({ error: 'Not qualified for Round 2' });
      return;
    }

    if (!gameState.questionActive) {
      if (typeof callback === 'function') callback({ error: 'Timer expired' });
      return;
    }

    const answerKey = `r${roundNumber}_${questionIndex}`;
    if (!t.answers) t.answers = {};
    if (!t.answers[answerKey]) t.answers[answerKey] = {};

    if (t.answers[answerKey].submitted) {
      if (typeof callback === 'function') callback({ error: 'Already submitted' });
      return;
    }

    const now = Date.now();
    const responseTime = gameState.questionStartTime ? Math.max(10, now - gameState.questionStartTime) : 1000;

    t.answers[answerKey].answer = answer;
    t.answers[answerKey].draft = answer;
    t.answers[answerKey].submitted = true;
    t.answers[answerKey].responseTime = responseTime;

    broadcastState();
    saveState();
    if (typeof callback === 'function') callback({ success: true, responseTime });
  });

  socket.on('disconnect', () => {
    // client disconnect
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("🚀 Socket server actively running on http://localhost:3000");
});
