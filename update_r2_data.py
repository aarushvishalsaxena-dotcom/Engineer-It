import re

data = [
    {
        "id": 1,
        "title": 'The "Open Fridge" Room Cooler',
        "category": 'THERMODYNAMICS',
        "scenarioDescription": 'Student in closed room with open refrigerator and pedestal fan blowing cold interior air out.',
        "image": '/round2/q01.webp',
        "question": 'What is fundamentally wrong with this cooling setup?',
        "options": [
            { "key": 'A', "text": 'The open door alters the center of gravity, risking tipping.' },
            { "key": 'B', "text": 'The fan creates aerodynamic drag on the condenser coils.' },
            { "key": 'C', "text": 'The fridge dumps absorbed heat plus compressor work back into the room.' },
            { "key": 'D', "text": 'The refrigerant flashes to gas too quickly at room pressure.' }
        ],
        "correctAnswer": 'C',
        "whyText": "By the Second Law of Thermodynamics, a refrigerator is a heat pump that dumps absorbed heat plus electric compressor motor work ( Qout = Qin + W ) through the back coils into the same room. The net energy released exceeds cooling energy, warming the room.",
        "fixText": "Keep refrigerator closed. Use an air conditioning unit where heat-rejecting coils (condenser) reside outdoors."
    },
    {
        "id": 2,
        "title": 'The Bed Blanket Gaming Laptop Setup',
        "category": 'HEAT TRANSFER',
        "scenarioDescription": 'Gaming laptop running high-load software placed directly on a plush, compressible duvet quilt.',
        "image": '/round2/q02.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'Bottom intake vents sink into soft bedding, choking convective airflow.' },
            { "key": 'B', "text": 'The quilt induces electrostatic discharge (ESD) into the motherboard.' },
            { "key": 'C', "text": 'Soft surfaces absorb acoustic noise, breaking the fans.' },
            { "key": 'D', "text": 'The blanket acts as a heat sink, rapidly cooling the battery.' }
        ],
        "correctAnswer": 'A',
        "whyText": "Bottom intake vents sink into soft bedding, choking convective airflow. Trapped warm exhaust and the quilt's high thermal resistance cause heat buildup, triggering aggressive CPU/GPU thermal throttling and shutdown.",
        "fixText": "Place laptop on a hard, flat surface (desk or elevated riser) to preserve an open 10–15 mm convective air gap."
    },
    {
        "id": 3,
        "title": '120V US Appliance in 230V Indian Wall Socket',
        "category": 'ELECTRICAL RATINGS',
        "scenarioDescription": '120V US-imported hair dryer plugged into Indian 230V socket via a simple mechanical plastic pin adapter.',
        "image": '/round2/q03.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The plastic adapter reverses the phase and neutral.' },
            { "key": 'B', "text": 'Connecting a single-voltage 120V resistive appliance to a 230V source without voltage conversion.' },
            { "key": 'C', "text": 'The hair dryer motor spins in reverse at 50Hz instead of 60Hz.' },
            { "key": 'D', "text": 'The cord will experience a dramatic drop in voltage.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Plastic pin converters only adapt plug prongs, not voltage. Dissipated power follows P = V² / R . Doubling voltage quadruples power ( 2² = 4× ), causing immediate heating element blowout, melted casings, and fire hazards.",
        "fixText": "Use a 230V-to-115V step-down transformer or verify device dual-voltage compatibility (100V–240V)."
    },
    {
        "id": 4,
        "title": 'Inverted AA Battery Cell in Series',
        "category": 'CIRCUIT ANALYSIS',
        "scenarioDescription": 'Flashlight battery tray with 3 AA cells: two correctly oriented, but one inserted backwards against spring.',
        "image": '/round2/q04.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The reversed cell acts as a capacitor.' },
            { "key": 'B', "text": 'The reversed cell changes the circuit from DC to AC.' },
            { "key": 'C', "text": 'Reversed electrochemical cell orientation in a series battery compartment.' },
            { "key": 'D', "text": 'The spring becomes strongly magnetized.' }
        ],
        "correctAnswer": 'C',
        "whyText": "Series cells add voltages constructively: Vtotal = V1 + V2 + V3 . A backwards cell opposes net EMF: 1.5V + 1.5V − 1.5V = 1.5V . Voltage falls below operating threshold; reverse current also causes cell overheating and chemical leakage.",
        "fixText": "Align all cells matching polarity markings (+ to flat terminal, − to spring contact)."
    },
    {
        "id": 5,
        "title": 'The "Hidden" Wi-Fi Router Inside Steel Almirah',
        "category": 'ELECTROMAGNETICS',
        "scenarioDescription": 'High-performance Wi-Fi router placed inside a closed heavy steel wardrobe to hide wires.',
        "image": '/round2/q05.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The steel cabinet prevents proper grounding.' },
            { "key": 'B', "text": 'Enclosing an RF transmitter inside a solid conductive steel cabinet.' },
            { "key": 'C', "text": 'The router will switch to a lower clock speed.' },
            { "key": 'D', "text": 'The metal amplifies the signal beyond FCC limits.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Conductive metal walls induce surface eddy currents that reflect and absorb 2.4 GHz/5 GHz microwave frequencies, turning the cabinet into a Faraday cage and attenuating external signal strength by over 35 dB.",
        "fixText": "Position router in an open, elevated, central location away from metal enclosures and concrete walls."
    },
    {
        "id": 6,
        "title": 'Parallel "Short-Circuit" Light Switch',
        "category": 'AC CIRCUIT WIRING',
        "scenarioDescription": 'Schematic of lamp across Phase & Neutral with a toggle switch wired in parallel across the lamp terminals.',
        "image": '/round2/q06.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The switch will only dim the lamp slightly.' },
            { "key": 'B', "text": 'Control switch connected in parallel with the load instead of in series.' },
            { "key": 'C', "text": 'The switch requires a ground wire to function in parallel.' },
            { "key": 'D', "text": 'The lamp will flicker at 50Hz.' }
        ],
        "correctAnswer": 'B',
        "whyText": "When switch is open, lamp works. When turned \"ON\", it connects Phase directly to Neutral with zero impedance, causing an instantaneous dead short circuit that trips the breaker (MCB) and vaporizes switch contacts.",
        "fixText": "Wire the switch in series on the Live (Phase) line prior to the lamp socket."
    },
    {
        "id": 7,
        "title": 'LED Reverse Polarity',
        "category": 'SEMICONDUCTORS',
        "scenarioDescription": '5mm LED on breadboard with long lead (anode) wired to Ground and flat cathode wired to +9V rail.',
        "image": '/round2/q07.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'P-N junction diode wired in reverse bias.' },
            { "key": 'B', "text": 'The breadboard cannot handle 9V.' },
            { "key": 'C', "text": 'The LED emits ultraviolet light instead of visible light.' },
            { "key": 'D', "text": 'The flat side of the LED always needs a resistor.' }
        ],
        "correctAnswer": 'A',
        "whyText": "LEDs only conduct when forward-biased ( Vanode > Vcathode ). Reverse bias widens the depletion layer, preventing carrier recombination; the LED stays dark.",
        "fixText": "Reverse orientation: wire longer anode lead (+) toward positive rail via resistor, cathode (−) to Ground."
    },
    {
        "id": 8,
        "title": 'Electrolytic Capacitor Polarity Inversion',
        "category": 'COMPONENT SAFETY',
        "scenarioDescription": 'Polarized aluminum electrolytic capacitor connected with negative stripe lead on +18V, swelling and smoking.',
        "image": '/round2/q08.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The capacitor is rated for AC voltage only.' },
            { "key": 'B', "text": 'Reverse voltage applied across polarized electrolytic capacitor.' },
            { "key": 'C', "text": 'The capacitance value is too small for 18V.' },
            { "key": 'D', "text": 'The capacitor is acting as an inductor.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Microscopic aluminum oxide dielectric layer is maintained only under positive voltage. Reverse voltage dissolves the dielectric, creating massive leakage current that boils electrolyte and bursts the safety vent.",
        "fixText": "Ensure lead marked with minus stripe (−) connects strictly to Ground / lowest potential."
    },
    {
        "id": 9,
        "title": 'Potentiometer Center Wiper Short Circuit',
        "category": 'SENSORS & ADC',
        "scenarioDescription": '5V power rail wired directly to center wiper pin, Ground on terminal 1, Arduino reading analog pin floating.',
        "image": '/round2/q09.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The Arduino cannot read 5V signals.' },
            { "key": 'B', "text": 'Wiper used as power input rather than divided voltage output.' },
            { "key": 'C', "text": 'The potentiometer needs a series capacitor.' },
            { "key": 'D', "text": 'The resistance of the track is too high.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Turning the potentiometer knob to the end position creates a zero-ohm dead short between 5V and GND, burning the resistive track.",
        "fixText": "Wire 5V and Ground to the two outer terminals; connect center wiper to MCU Analog Input pin (A0)."
    },
    {
        "id": 10,
        "title": 'Lever Fulcrum in Wrong Place',
        "category": 'ENGINEERING MECHANICS',
        "scenarioDescription": 'Heavy block being lifted by crowbar, but fulcrum pivot is positioned near operator hands.',
        "image": '/round2/q10.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'Severe mechanical disadvantage due to inverted lever proportions.' },
            { "key": 'B', "text": 'The crowbar acts as a Class 3 lever instead of Class 1.' },
            { "key": 'C', "text": 'The fulcrum absorbs all the kinetic energy.' },
            { "key": 'D', "text": 'The effort force is pushing in the wrong direction.' }
        ],
        "correctAnswer": 'A',
        "whyText": "By principle of moments ( MA = deffort / dload ), placing fulcrum near the operator makes effort arm tiny, requiring vastly more input force than the boulder's weight.",
        "fixText": "Shift fulcrum right next to heavy load to maximize effort arm length and multiply force."
    },
    {
        "id": 11,
        "title": 'Inefficient Ceiling-Only Pulley System',
        "category": 'STATICS & HOISTING',
        "scenarioDescription": 'Rig labeled "3:1 Advantage" with three pulleys all bolted rigidly to ceiling with continuous rope.',
        "image": '/round2/q11.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The rope is too thin to handle the tension.' },
            { "key": 'B', "text": 'No mechanical advantage; claiming 3:1 ratio with only fixed pulleys.' },
            { "key": 'C', "text": 'The pulleys are spinning too fast.' },
            { "key": 'D', "text": 'The system creates a 1:3 disadvantage.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Fixed pulleys only redirect tension direction; mechanical advantage remains 1:1 while friction increases. Load weight is not distributed across multiple moving strands.",
        "fixText": "Mount movable pulleys directly to load block so upward rope strands share load ( T = W / n )."
    },
    {
        "id": 12,
        "title": 'Gearbox Speed Step-Up Stall',
        "category": 'POWER TRANSMISSION',
        "scenarioDescription": 'Tiny toy motor driving huge high-speed fan via large step-up gear train, fan stalled and motor overheating.',
        "image": '/round2/q12.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The fan blades are installed backwards.' },
            { "key": 'B', "text": 'The gears lack lubrication.' },
            { "key": 'C', "text": 'Large speed step-up ratio without adequate driver torque.' },
            { "key": 'D', "text": 'The motor is receiving AC instead of DC.' }
        ],
        "correctAnswer": 'C',
        "whyText": "Power is conserved ( P = τ × ω ). Stepping up angular velocity reduces output torque proportionally. Insufficient torque stalls the motor under fan inertia, pulling damaging stall current.",
        "fixText": "Implement gear reduction (torque multiplier) or select a motor rated for fan starting torque."
    },
    {
        "id": 13,
        "title": 'Bridge Beam Unstable Support',
        "category": 'CIVIL STRUCTURES',
        "scenarioDescription": 'Concrete bridge beam with one end on concrete pier and other resting on loose dry pile of unbonded rubble.',
        "image": '/round2/q13.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The concrete beam lacks rebar.' },
            { "key": 'B', "text": 'The bridge span is too short.' },
            { "key": 'C', "text": 'Bridge bearing resting on unbonded, loose stone embankment.' },
            { "key": 'D', "text": 'The pier on the left is too rigid.' }
        ],
        "correctAnswer": 'C',
        "whyText": "Traffic imparts vertical and lateral dynamic shear loads. Unmortared gravel lacks cohesive shear strength; vibrations cause lateral shifting, differential settlement, and sudden deck collapse.",
        "fixText": "Excavate to bedrock and cast a monolithic reinforced concrete abutment on a spread footing."
    },
    {
        "id": 14,
        "title": 'Faulty Siphon Elevation',
        "category": 'FLUID MECHANICS',
        "scenarioDescription": 'Water-filled siphon tube configured to pull liquid from floor bucket up into table bucket without pump.',
        "image": '/round2/q14.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The tube diameter is too small.' },
            { "key": 'B', "text": 'Attempting to operate a gravity siphon against positive elevation gradient.' },
            { "key": 'C', "text": 'The water is too cold to siphon.' },
            { "key": 'D', "text": 'The buckets need to be sealed airtight.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Siphons depend on hydrostatic pressure gradients ( ΔP = ρgΔh ). Net passive flow requires discharge surface to be lower than inlet surface. Spontaneous upward flow violates energy conservation.",
        "fixText": "Lower discharge container below source reservoir or install a mechanical inline pump."
    },
    {
        "id": 15,
        "title": 'Thermos Flask Heat Leakage',
        "category": 'HEAT TRANSFER',
        "scenarioDescription": 'Cutaway of vacuum flask showing solid steel support rod bridging inner liquid container to outer metal body.',
        "image": '/round2/q15.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'The inner flask is too small.' },
            { "key": 'B', "text": 'A solid conductive metal bridge bypassing the insulating vacuum gap.' },
            { "key": 'C', "text": 'The vacuum pressure is too high.' },
            { "key": 'D', "text": 'Steel absorbs radiation.' }
        ],
        "correctAnswer": 'B',
        "whyText": "The vacuum eliminates convection and air conduction. A solid metal bracket introduces an unhindered Fourier conduction path ( q = −kA dT/dx ), rapidly dissipating beverage heat.",
        "fixText": "Support inner flask using low-conductivity silicone/polymer mounts and preserve continuous vacuum."
    },
    {
        "id": 16,
        "title": 'Infinite Loop Pseudo-Code',
        "category": 'PROGRAMMING',
        "scenarioDescription": 'Code snippet on monitor: int x = 0; while (x < 10) { print(x); }',
        "image": '/round2/q16.webp',
        "question": 'What is fundamentally wrong with this code?',
        "options": [
            { "key": 'A', "text": 'x is declared as an int instead of float.' },
            { "key": 'B', "text": 'Loop control variable x is never incremented inside loop body.' },
            { "key": 'C', "text": 'The print function is missing quotes.' },
            { "key": 'D', "text": 'The while condition should use <=' }
        ],
        "correctAnswer": 'B',
        "whyText": "With x permanently 0, condition x < 10 remains permanently true, causing an infinite loop that pegs CPU core usage at 100% and freezes application flow.",
        "fixText": "Add an update statement (x++; or x += 1;) within the loop block."
    },
    {
        "id": 17,
        "title": 'Integer Overflow Code',
        "category": 'ARCHITECTURE',
        "scenarioDescription": 'C++ code: short int x = 32767; x = x + 1; print(x); producing output -32768.',
        "image": '/round2/q17.webp',
        "question": 'What is fundamentally wrong with this code?',
        "options": [
            { "key": 'A', "text": 'Signed 16-bit integer arithmetic overflow.' },
            { "key": 'B', "text": 'The compiler cannot add 1 to a variable initialized on the same line.' },
            { "key": 'C', "text": 'Memory leak in the stack.' },
            { "key": 'D', "text": 'Syntax error: x = x + 1 is invalid.' }
        ],
        "correctAnswer": 'A',
        "whyText": "In 16-bit two's complement binary, 32767 is 0111 1111 1111 1111. Adding 1 flips sign bit to 1 (1000 0000 0000 0000), wrapping to −32768.",
        "fixText": "Use unsigned short (range 0 to 65535) or a wider 32-bit integer type (int or int32_t)."
    },
    {
        "id": 18,
        "title": 'Parallel Circuit Resistance Error',
        "category": 'NETWORK ANALYSIS',
        "scenarioDescription": 'Schematic of three 1kΩ resistors in parallel with student label: "Total Resistance = 3k Ohms".',
        "image": '/round2/q18.webp',
        "question": 'What is fundamentally wrong with this label?',
        "options": [
            { "key": 'A', "text": 'The resistors should be drawn vertically.' },
            { "key": 'B', "text": 'Total resistance is actually 1k Ohms.' },
            { "key": 'C', "text": 'Summing parallel branch resistances linearly instead of using reciprocal formula.' },
            { "key": 'D', "text": 'Parallel resistors always have infinite resistance.' }
        ],
        "correctAnswer": 'C',
        "whyText": "Adding parallel branches creates alternate conduction paths, reducing net resistance: 1/Req = 1/1k + 1/1k + 1/1k , giving Req = 1000/3 ≈ 333.3 Ω .",
        "fixText": "Calculate equivalent parallel resistance as 333.3 Ω using reciprocal admittance formula."
    },
    {
        "id": 19,
        "title": 'Fuse Placed After the Load on Neutral',
        "category": 'ELECTRICAL SAFETY',
        "scenarioDescription": 'Domestic 230V single-phase circuit diagram showing protective fuse on Neutral return line.',
        "image": '/round2/q19.webp',
        "question": 'What is fundamentally wrong with this setup?',
        "options": [
            { "key": 'A', "text": 'Cartridge fuse installed on Neutral conductor instead of Live/Phase line.' },
            { "key": 'B', "text": 'Fuses do not work on AC circuits.' },
            { "key": 'C', "text": 'The fuse will blow instantly.' },
            { "key": 'D', "text": 'The fuse must be connected in parallel.' }
        ],
        "correctAnswer": 'A',
        "whyText": "When fuse blows under fault, it breaks the return circuit, but device remains energized at 230V live. Anyone servicing it touches live voltage, completing ground shock loop.",
        "fixText": "Always position fuses and MCBs upstream on the Live (Phase) wire to isolate appliance when open."
    },
    {
        "id": 20,
        "title": 'Cold Solder Joint Visual',
        "category": 'MANUFACTURING QC',
        "scenarioDescription": 'Macro photo of PCB resistor pin where solder is dull, grainy, spherical, and not bonded to copper pad.',
        "image": '/round2/q20.webp',
        "question": 'What is fundamentally wrong with this joint?',
        "options": [
            { "key": 'A', "text": 'The solder is too shiny.' },
            { "key": 'B', "text": 'Cold solder joint from insufficient heating or mechanical movement during cooling.' },
            { "key": 'C', "text": 'The resistor is upside down.' },
            { "key": 'D', "text": 'Wrong type of flux used.' }
        ],
        "correctAnswer": 'B',
        "whyText": "Inadequate wetting temperature prevents solder from forming an intermetallic bond with copper, yielding high resistance, signal noise, and mechanical detachment.",
        "fixText": "Clean with flux, heat both pin lead and pad simultaneously with soldering tip, reflowing into a concave shiny fillet."
    }
]

import json
content = f"const round2Questions = {json.dumps(data, indent=2)};\n\nexport default round2Questions;"
with open('src/data/round2Questions.js', 'w', encoding='utf8') as f:
    f.write(content)
print("Updated round2Questions.js")
