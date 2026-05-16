"""Seed cards for STEMScroll — hand-curated, source-verified STEM facts/quizzes/experiments/stories/diagrams.
Mix of all 8 subjects, all 4 age modes, all 5 card types.
Every card carries a confidence score (0.95 for curated) and a source citation.
"""

# Map source label → canonical URL. Backend stamps source_url onto each card at boot.
SOURCE_URLS = {
    "National Geographic Kids": "https://kids.nationalgeographic.com",
    "NASA": "https://www.nasa.gov",
    "ESA": "https://www.esa.int",
    "Royal Society of Chemistry": "https://www.rsc.org/learn-chemistry",
    "BBC Earth": "https://www.bbcearth.com",
    "NASA History": "https://www.nasa.gov/history",
    "Wolfram MathWorld": "https://mathworld.wolfram.com",
    "Tour Eiffel Official": "https://www.toureiffel.paris/en",
    "Nature Journal": "https://www.nature.com",
    "Physics World": "https://physicsworld.com",
    "Journal of Experimental Biology": "https://journals.biologists.com/jeb",
    "CERN Outreach": "https://home.cern/science",
    "Natural History Museum": "https://www.nhm.ac.uk",
    "Solar Dynamics Observatory": "https://sdo.gsfc.nasa.gov",
    "Royal Institution": "https://www.rigb.org",
    "Nature Neuroscience": "https://www.nature.com/neuro",
    "Scientific American": "https://www.scientificamerican.com",
    "NASA Chandra": "https://chandra.harvard.edu",
    "Caltech Physics": "https://www.pma.caltech.edu",
    "GPS.gov": "https://www.gps.gov",
    "Math Stack Exchange": "https://math.stackexchange.com",
    "IEEE": "https://www.ieee.org",
    "Royal Geographical Society": "https://www.rgs.org",
    "ITU": "https://www.itu.int",
}

SEED_CARDS = [
    # ─── FACTS ──────────────────────────────────────────────────────────
    {"id": "f1", "type": "fact", "subject": "biology", "ageMode": "explorer",
     "emoji": "🐙", "headline": "Octopuses have THREE hearts!",
     "body": "Two hearts pump blood to the gills. One pumps blood to the whole body. When they swim, the body heart stops — that's why they like to crawl!",
     "source": "National Geographic Kids", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f2", "type": "fact", "subject": "physics", "ageMode": "discoverer",
     "emoji": "⚡", "headline": "Lightning is hotter than the Sun",
     "body": "A bolt of lightning reaches 30,000°C — five times hotter than the Sun's surface. It heats the air so fast the air explodes — and that explosion is what we hear as thunder!",
     "source": "NASA", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f3", "type": "fact", "subject": "astronomy", "ageMode": "discoverer",
     "emoji": "🌌", "headline": "There are more stars than grains of sand",
     "body": "Scientists estimate the observable universe has 10^24 stars — that's more than every grain of sand on every beach on Earth, combined.",
     "source": "ESA", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f4", "type": "fact", "subject": "chemistry", "ageMode": "scientist",
     "emoji": "⚗️", "headline": "Diamond and graphite are the same element",
     "body": "Both are pure carbon. The difference is bonding: diamond's atoms form a 3D tetrahedral lattice (very hard), while graphite stacks in sheets (slippery, great for pencils).",
     "source": "Royal Society of Chemistry", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f5", "type": "fact", "subject": "nature", "ageMode": "explorer",
     "emoji": "🌳", "headline": "Trees TALK to each other",
     "body": "Trees share food and warnings through tiny mushroom threads under the soil. Scientists call it the 'Wood Wide Web'!",
     "source": "BBC Earth", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f6", "type": "fact", "subject": "technology", "ageMode": "discoverer",
     "emoji": "💻", "headline": "Your phone is millions of times more powerful than NASA's moon computer",
     "body": "The Apollo 11 guidance computer had 64KB of memory. Your phone has billions of times that — yet astronauts landed humans on the Moon with it!",
     "source": "NASA History", "xpValue": 5, "mascot": "zoomerroo"},

    {"id": "f7", "type": "fact", "subject": "maths", "ageMode": "scientist",
     "emoji": "🌀", "headline": "The Fibonacci sequence is hiding in nature",
     "body": "1, 1, 2, 3, 5, 8, 13… each number is the sum of the two before it. This pattern appears in sunflower seeds, nautilus shells, and galaxy arms. Mathematicians are still discovering why nature loves it.",
     "source": "Wolfram MathWorld", "xpValue": 5, "mascot": "zoomerroo"},

    {"id": "f8", "type": "fact", "subject": "engineering", "ageMode": "discoverer",
     "emoji": "🏗️", "headline": "The Eiffel Tower grows 15cm in summer",
     "body": "Heat makes iron expand. On a hot day, the Eiffel Tower is actually taller than on a cold day — by about the length of a pencil!",
     "source": "Tour Eiffel Official", "xpValue": 5, "mascot": "zoomerroo"},

    {"id": "f9", "type": "fact", "subject": "biology", "ageMode": "scientist",
     "emoji": "🧬", "headline": "You're 60% bacteria by cell count",
     "body": "Your body has roughly 30 trillion human cells and 38 trillion bacterial cells. Most live in your gut and help you digest food, train your immune system, and even affect mood.",
     "source": "Nature Journal", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f10", "type": "fact", "subject": "astronomy", "ageMode": "explorer",
     "emoji": "🌙", "headline": "The Moon is moving away from us",
     "body": "Every year the Moon drifts about 3.8 cm further from Earth. That's the speed your fingernails grow!",
     "source": "NASA", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f11", "type": "fact", "subject": "physics", "ageMode": "explorer",
     "emoji": "💧", "headline": "Hot water can freeze faster than cold",
     "body": "It's called the Mpemba effect. Sometimes hot water turns into ice quicker than cold water — and scientists are still arguing about why!",
     "source": "Physics World", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f12", "type": "fact", "subject": "nature", "ageMode": "discoverer",
     "emoji": "🐝", "headline": "Bees can recognise human faces",
     "body": "Bees use the same 'parts-based' strategy humans use — eyes, nose, mouth — to recognise faces. Tiny brains, massive memories!",
     "source": "Journal of Experimental Biology", "xpValue": 5, "mascot": "sprouty"},

    # ─── QUIZZES ────────────────────────────────────────────────────────
    {"id": "q1", "type": "quiz", "subject": "astronomy", "ageMode": "discoverer",
     "emoji": "🪐", "headline": "Which planet has the most moons?",
     "body": "The Solar System has lots of moons. Some planets have only a few — others have dozens. Can you guess the champion?",
     "quizOptions": ["Jupiter", "Saturn", "Neptune"],
     "correctAnswer": 1,
     "explanation": "Saturn has 146 confirmed moons (as of 2024), edging out Jupiter's 95. Both keep gaining more as telescopes get better!",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q2", "type": "quiz", "subject": "biology", "ageMode": "explorer",
     "emoji": "🦒", "headline": "How many bones in a giraffe's neck?",
     "body": "Giraffes have huge long necks. How many bones do you think are inside?",
     "quizOptions": ["7 (same as humans)", "20", "100"],
     "correctAnswer": 0,
     "explanation": "Just 7! Same as humans — but each bone is MUCH longer.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q3", "type": "quiz", "subject": "chemistry", "ageMode": "scientist",
     "emoji": "🧪", "headline": "What's the most abundant element in the universe?",
     "body": "Stars, galaxies, gas clouds — what are they mostly made of?",
     "quizOptions": ["Oxygen", "Hydrogen", "Carbon"],
     "correctAnswer": 1,
     "explanation": "Hydrogen makes up about 75% of the universe's normal matter. It's the simplest atom — just one proton and one electron.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q4", "type": "quiz", "subject": "maths", "ageMode": "discoverer",
     "emoji": "🔢", "headline": "What's the only even prime number?",
     "body": "Prime numbers are only divisible by 1 and themselves. Most primes are odd — but one even prime exists!",
     "quizOptions": ["0", "2", "4"],
     "correctAnswer": 1,
     "explanation": "2! It's the only even number that's prime — every other even number divides by 2 (so it can't be prime).",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q5", "type": "quiz", "subject": "physics", "ageMode": "discoverer",
     "emoji": "🚀", "headline": "What's the speed of light in a vacuum?",
     "body": "Light is the universal speed limit. How fast does it actually go?",
     "quizOptions": ["300,000 km/h", "300,000 km/s", "30,000 km/s"],
     "correctAnswer": 1,
     "explanation": "299,792 km PER SECOND — fast enough to circle Earth 7.5 times in one second.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q6", "type": "quiz", "subject": "technology", "ageMode": "scientist",
     "emoji": "🤖", "headline": "What does CPU stand for?",
     "body": "Every computer has one. It's the 'brain' of the device.",
     "quizOptions": ["Central Power Unit", "Central Processing Unit", "Computer Program Unit"],
     "correctAnswer": 1,
     "explanation": "Central Processing Unit — it executes the instructions in software, billions per second.",
     "xpValue": 10, "mascot": "quizzle"},

    # ─── EXPERIMENTS ────────────────────────────────────────────────────
    {"id": "e1", "type": "experiment", "subject": "chemistry", "ageMode": "explorer",
     "emoji": "🌋", "headline": "Make a fizzy volcano!",
     "body": "Build your very own bubbly eruption with stuff from the kitchen.",
     "materials": ["Baking soda (2 spoons)", "Vinegar (half cup)", "Red food colouring (optional)"],
     "steps": ["Put baking soda in a cup.", "Add a drop of red colouring.", "Pour in vinegar — watch it ERUPT!"],
     "whatHappens": "Vinegar (acid) + baking soda (base) makes carbon dioxide gas, which bubbles up like lava!",
     "parentNote": "Safe — no heat needed. Use on a tray to catch fizz. 3 mins setup.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "e2", "type": "experiment", "subject": "physics", "ageMode": "discoverer",
     "emoji": "🎈", "headline": "Static-charge a balloon",
     "body": "Make a balloon stick to a wall with nothing but YOUR hair.",
     "materials": ["A balloon", "Your hair", "A wall"],
     "steps": ["Blow up the balloon.", "Rub it on your hair for 10 seconds.", "Hold it against a wall — it sticks!"],
     "whatHappens": "Rubbing transfers electrons. The balloon becomes negatively charged and is attracted to the wall.",
     "parentNote": "Zero risk. Works best on dry days.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "e3", "type": "experiment", "subject": "biology", "ageMode": "explorer",
     "emoji": "🌱", "headline": "Grow a bean in a jar",
     "body": "See ROOTS grow before your eyes!",
     "materials": ["A dried bean", "Wet paper towel", "A glass jar"],
     "steps": ["Wet the paper towel.", "Wrap it around the bean inside the jar.", "Wait 3 days — check daily!"],
     "whatHappens": "The bean absorbs water, swells, and sprouts a root downward and a shoot upward — that's gravity sensing!",
     "parentNote": "10-day project. Great for a window sill.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "e4", "type": "experiment", "subject": "nature", "ageMode": "discoverer",
     "emoji": "🌈", "headline": "Make rainbow milk!",
     "body": "Watch colours dance across a plate of milk.",
     "materials": ["A plate of milk", "Food colouring (3 colours)", "Cotton bud + dish soap"],
     "steps": ["Pour milk on a plate.", "Drop colours in the centre.", "Touch with a soapy cotton bud — colours EXPLODE!"],
     "whatHappens": "Soap breaks the milk's surface tension and chases the fat molecules, dragging the colours along.",
     "parentNote": "Use a tray. Discard milk after.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "e5", "type": "experiment", "subject": "engineering", "ageMode": "discoverer",
     "emoji": "🌉", "headline": "Paper bridge challenge",
     "body": "Can YOU make a paper bridge strong enough to hold a book?",
     "materials": ["2 sheets of A4 paper", "2 books (as towers)", "A third book to test"],
     "steps": ["Place books 20cm apart.", "Fold one paper into a flat strip — test it.", "Fold the other into a 'concertina' (zigzag) — test again!"],
     "whatHappens": "The zigzag shape distributes weight across many beams — that's why bridges use trusses.",
     "parentNote": "Great intro to engineering. 5 mins.",
     "xpValue": 15, "mascot": "wombles"},

    # ─── STORIES ────────────────────────────────────────────────────────
    {"id": "s1", "type": "story", "subject": "physics", "ageMode": "discoverer",
     "emoji": "⚛️", "headline": "You are an electron",
     "body": "You're an electron, zipping around the nucleus of a hydrogen atom at nearly the speed of light. You can't be in any spot — only in special 'shells'. When a photon hits you, you JUMP up. When you fall back, you release light. That's how every neon sign, every star, every glowing screen works — including this one.",
     "source": "CERN Outreach", "xpValue": 10, "mascot": "sprouty"},

    {"id": "s2", "type": "story", "subject": "biology", "ageMode": "explorer",
     "emoji": "🐛", "headline": "Inside a caterpillar's cocoon",
     "body": "You're a caterpillar. You spin a tight silk house. Inside, you turn into goo. Tiny groups of cells called 'imaginal discs' read the recipe for a butterfly. Wings grow. Legs grow. Eyes grow. Two weeks later — you crack open the cocoon and FLY. Magic? No. Biology!",
     "source": "Natural History Museum", "xpValue": 10, "mascot": "sprouty"},

    {"id": "s3", "type": "story", "subject": "astronomy", "ageMode": "scientist",
     "emoji": "🌠", "headline": "You are a photon from the Sun",
     "body": "You were born in the Sun's core 100,000 years ago, bouncing through layers of plasma. Eight minutes ago you finally escaped its surface and shot toward Earth. You hit a leaf. The leaf used you to split water and store energy in sugar. That sugar fed a cow. The cow's milk fed YOU. You ARE sunlight.",
     "source": "Solar Dynamics Observatory", "xpValue": 10, "mascot": "drSprout"},

    # ─── DIAGRAMS ───────────────────────────────────────────────────────
    {"id": "d1", "type": "diagram", "subject": "biology", "ageMode": "discoverer",
     "emoji": "❤️", "headline": "How your heart pumps blood",
     "body": "Right side pulls in tired blood from your body and pushes it to the lungs. Lungs add oxygen. Left side pulls the fresh blood and pushes it back out to every cell — 100,000 times a day.",
     "diagramParts": [
         {"label": "Right Atrium", "desc": "Receives blood from body"},
         {"label": "Lungs", "desc": "Add oxygen, remove CO₂"},
         {"label": "Left Ventricle", "desc": "Pumps blood to body"},
     ],
     "xpValue": 10, "mascot": "sprouty"},

    {"id": "d2", "type": "diagram", "subject": "technology", "ageMode": "scientist",
     "emoji": "🔌", "headline": "How a transistor works",
     "body": "A transistor is a tiny switch. When voltage is applied to the gate, electrons flow between source and drain — that's a '1'. No voltage? No flow — that's a '0'. Your phone has BILLIONS of these switching billions of times per second.",
     "diagramParts": [
         {"label": "Source", "desc": "Where electrons enter"},
         {"label": "Gate", "desc": "Controls the flow"},
         {"label": "Drain", "desc": "Where electrons leave"},
     ],
     "xpValue": 10, "mascot": "zoomerroo"},

    {"id": "d3", "type": "diagram", "subject": "astronomy", "ageMode": "discoverer",
     "emoji": "🌍", "headline": "Earth's layers",
     "body": "Earth is like a peach. The crust is the thin skin. The mantle is the squishy flesh. The outer core is liquid metal. The inner core is solid iron — hotter than the Sun's surface.",
     "diagramParts": [
         {"label": "Crust", "desc": "Where we live, ~30km thick"},
         {"label": "Mantle", "desc": "Hot, slow-flowing rock"},
         {"label": "Core", "desc": "Iron, 5,400°C"},
     ],
     "xpValue": 10, "mascot": "sprouty"},

    # ─── More variety ───────────────────────────────────────────────────
    {"id": "f13", "type": "fact", "subject": "chemistry", "ageMode": "discoverer",
     "emoji": "🍋", "headline": "Lemons can power a clock",
     "body": "Stick a copper coin and a zinc nail into a lemon — you get a battery! The lemon's acid moves electrons between the metals. Connect a few in a row and you can power a small clock.",
     "source": "Royal Institution", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f14", "type": "fact", "subject": "biology", "ageMode": "discoverer",
     "emoji": "🧠", "headline": "Your brain uses 20% of your energy",
     "body": "Your brain is only 2% of your body weight — but burns a fifth of all the energy you eat. Thinking is HARD work!",
     "source": "Nature Neuroscience", "xpValue": 5, "mascot": "sprouty"},

    {"id": "f15", "type": "fact", "subject": "nature", "ageMode": "scientist",
     "emoji": "🍄", "headline": "The biggest organism is a fungus",
     "body": "A honey fungus in Oregon covers 9 km² and weighs 35,000 tons. Most of it lives underground as a network of threads. It's been growing for ~8,000 years.",
     "source": "Scientific American", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f16", "type": "fact", "subject": "astronomy", "ageMode": "scientist",
     "emoji": "⚫", "headline": "Black holes can sing",
     "body": "A black hole in the Perseus galaxy cluster emits pressure waves through gas — translated to sound, it's a B-flat 57 octaves below middle C. The lowest note known.",
     "source": "NASA Chandra", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f17", "type": "fact", "subject": "physics", "ageMode": "scientist",
     "emoji": "🌀", "headline": "Quantum particles can be in two places at once",
     "body": "Before you measure them, electrons exist as 'probability clouds' — they're not in one location, but everywhere they could be, weighted by likelihood. Measurement collapses this into a single position. Reality is weirder than fiction.",
     "source": "Caltech Physics", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f18", "type": "fact", "subject": "engineering", "ageMode": "scientist",
     "emoji": "🛰️", "headline": "GPS satellites need Einstein",
     "body": "GPS satellites move so fast that time ticks slower for them (special relativity), but they're farther from Earth's gravity, so time ticks FASTER (general relativity). Net: 38 microseconds faster per day. Without correction, GPS would drift 10km per day.",
     "source": "GPS.gov", "xpValue": 5, "mascot": "drSprout"},

    {"id": "f19", "type": "fact", "subject": "maths", "ageMode": "discoverer",
     "emoji": "♾️", "headline": "Some infinities are BIGGER than others",
     "body": "There are infinite whole numbers (1,2,3…). There are also infinite numbers between 0 and 1. But the second infinity is LARGER. Mathematician Georg Cantor proved it in 1891.",
     "source": "Math Stack Exchange", "xpValue": 5, "mascot": "zoomerroo"},

    {"id": "f20", "type": "fact", "subject": "technology", "ageMode": "explorer",
     "emoji": "📱", "headline": "Wi-Fi is invisible light",
     "body": "Wi-Fi sends data using radio waves — a kind of light our eyes can't see. Right now, invisible light is bouncing all around you carrying messages!",
     "source": "IEEE", "xpValue": 5, "mascot": "zoomerroo"},

    {"id": "q7", "type": "quiz", "subject": "nature", "ageMode": "explorer",
     "emoji": "🐢", "headline": "What's the longest-living animal?",
     "body": "Some animals live a long, long, LONG time. Which one is the champion?",
     "quizOptions": ["Tortoise", "Greenland shark", "Bowhead whale"],
     "correctAnswer": 1,
     "explanation": "Greenland sharks can live 400+ years! One was estimated at 512 years old.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q8", "type": "quiz", "subject": "engineering", "ageMode": "discoverer",
     "emoji": "🏛️", "headline": "What shape is strongest?",
     "body": "Architects use this shape everywhere — bridges, domes, even eggshells.",
     "quizOptions": ["Square", "Triangle", "Circle"],
     "correctAnswer": 1,
     "explanation": "Triangle! It cannot be deformed without changing the length of a side — squares squish, triangles don't.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "q9", "type": "quiz", "subject": "astronomy", "ageMode": "explorer",
     "emoji": "☀️", "headline": "What is the Sun made of?",
     "body": "Our Sun is a giant ball of glowing gas. What kind of gas?",
     "quizOptions": ["Fire", "Hydrogen and Helium", "Lava"],
     "correctAnswer": 1,
     "explanation": "Mostly hydrogen and helium! The Sun is squeezing hydrogen into helium and that's where its energy comes from.",
     "xpValue": 10, "mascot": "quizzle"},

    {"id": "e6", "type": "experiment", "subject": "physics", "ageMode": "explorer",
     "emoji": "🪙", "headline": "Sink or float?",
     "body": "Guess which things will float and which will sink!",
     "materials": ["A bowl of water", "A coin, a leaf, an apple, a pebble", "A towel for spills"],
     "steps": ["Predict! Will it sink or float?", "Drop each one in slowly.", "Count how many you got right."],
     "whatHappens": "Things less dense than water (apple, leaf) float. Denser things (coin, pebble) sink — even though the apple is HEAVIER than the coin!",
     "parentNote": "Surprising result! Density beats weight.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "e7", "type": "experiment", "subject": "technology", "ageMode": "discoverer",
     "emoji": "🔦", "headline": "Make a torch beam visible",
     "body": "See a laser-like beam in fog!",
     "materials": ["A torch / phone flashlight", "A misty bathroom (after a shower)", "A dark room"],
     "steps": ["Run a hot shower for 2 mins.", "Turn off lights. Shine the torch through the mist.", "See the visible beam!"],
     "whatHappens": "Light is invisible until it hits something. Water droplets scatter the light into your eyes — making the beam visible.",
     "parentNote": "Great intro to optics. 5 mins.",
     "xpValue": 15, "mascot": "wombles"},

    {"id": "d4", "type": "diagram", "subject": "chemistry", "ageMode": "discoverer",
     "emoji": "💧", "headline": "Water molecule",
     "body": "A water molecule is two hydrogen atoms hugging one oxygen atom. The 'bent' shape is why water has weird properties — like floating ice and dissolving almost anything.",
     "diagramParts": [
         {"label": "Oxygen (O)", "desc": "Pulls electrons strongly"},
         {"label": "Hydrogen (H) ×2", "desc": "Bonded at 104.5° angle"},
         {"label": "Polarity", "desc": "Creates surface tension"},
     ],
     "xpValue": 10, "mascot": "sprouty"},

    {"id": "d5", "type": "diagram", "subject": "physics", "ageMode": "scientist",
     "emoji": "🌈", "headline": "Electromagnetic spectrum",
     "body": "Visible light is a tiny slice of a giant rainbow. Radio waves, microwaves, infrared, visible, UV, X-rays, and gamma rays are all the SAME thing — electromagnetic waves at different wavelengths.",
     "diagramParts": [
         {"label": "Radio", "desc": "Longest waves — Wi-Fi, FM"},
         {"label": "Visible", "desc": "What our eyes see"},
         {"label": "Gamma", "desc": "Shortest, highest energy"},
     ],
     "xpValue": 10, "mascot": "drSprout"},

    {"id": "s4", "type": "story", "subject": "nature", "ageMode": "explorer",
     "emoji": "💦", "headline": "You are a raindrop",
     "body": "You started in the ocean. The sun warmed you up and you floated into the sky. You bumped into other water droplets and made a cloud. The wind blew you over a forest. You got heavy — and FELL. A tree caught you. Its roots drank you up. And up, up, up you go again!",
     "source": "Royal Geographical Society", "xpValue": 10, "mascot": "sprouty"},

    {"id": "s5", "type": "story", "subject": "technology", "ageMode": "discoverer",
     "emoji": "📡", "headline": "You are a signal",
     "body": "You're a message on a phone. You jump from a tower to a satellite 35,000 km above Earth. The satellite shoots you back down to another tower across the world. Then through underground cables — at the speed of light — into someone else's phone. All in 0.1 seconds.",
     "source": "ITU", "xpValue": 10, "mascot": "zoomerroo"},
]

for _c in SEED_CARDS:
    _src = _c.get("source")
    if _src and _src in SOURCE_URLS:
        _c["source_url"] = SOURCE_URLS[_src]
