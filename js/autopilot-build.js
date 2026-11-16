"use strict";
// Weights for autopilot's choices. The game still decides which cards can appear.
const autopilotBuild = {
    guns: {
        "nail gun": { value: 14, upgrades: "needle gun|rivet gun|pneumatic actuator|ice crystal nucleation|rotary cannon|gauge|supercritical fission|irradiated|incendiary ammunition|ricochet" },
        shotgun: { value: 8, upgrades: "needle gun|rivet gun|flechettes|semi-automatic|spin-statistics|Noether violation|repeater|nail-shot|foam-shot|photonic crystal|ice-shot|K-selection|incendiary ammunition" },
        "super balls": { value: 14, upgrades: "gauge|incendiary ammunition|rebound|slime|borax|polyurethane foam|fatigue|autocannon|super duper|super ball|ricochet|uncertainty principle" },
        wave: { value: 23, upgrades: "phase velocity|amplitude|propagation|bound state|transverse|isotropic|mechanical resonance|sympathetic resonance|uncertainty principle|quasiparticles" },
        missiles: { value: 12, upgrades: "liquid-propellant|hypergolic propellant|cruise missile|ICBM|AIM-9 Sidewinder|launch system|missile guidance|MIRV|fragmentation|ammonium nitrate|nitroglycerin|shaped charge|iridium-192" },
        grenades: { value: 5, upgrades: "MIRV|fragmentation|rocket-propelled grenade|vacuum bomb|impulse|precision bombing|chain reaction|flame test|pyrotechnics|fireworks|neutron bomb|vacuum permittivity|ammonium nitrate|nitroglycerin|shaped charge|iridium-192" },
        spores: { value: 13, upgrades: "mycelial fragmentation|cordyceps|colony|cryodesiccation|flagella|mutualism|necrophage|siphonaptera|nematodes|K-selection|path integration|shock wave" },
        drones: { value: 19, upgrades: "exponential growth|ablative drones|standardization|delivery drone|von Neumann probe|brushless motor|axial flux motor|path integration|incendiary ammunition" },
        foam: { value: 11, upgrades: "adhesive|electrostatic induction|necrophage|uncertainty principle|surface tension|aerogel|Marangoni effect|cavitation|foam fractionation|laminar flow|ideal gas law|pressure vessel|capacitor bank" },
        harpoon: { value: 12, upgrades: "ceramics|railgun|Bitter electromagnet|alternator|autonomous defense|rebar|maul|wear|spalling|Bessemer process|smelting|UHMWPE|induction furnace|brittle|quasiparticles|polyurethane foam|fragmentation" },
        mine: { value: 5, upgrades: "gauge|supercritical fission|irradiated|shock wave|booby trap|elephants toothpaste|blast ball|laser-mines|sentry|extended magazine" },
        laser: { value: 15, upgrades: "quasiparticles|optical tweezers|optical amplifier|relativistic momentum|iridescence|lens|compound lens|specular reflection|diffraction grating|collimator|diffuse beam|output coupler|delayed-choice|acousto-optic modulator|infrared diode|dye laser|free-electron laser|pulse" },
    },
    fields: {
        "field emitter": { value: 28, upgrades: "Grand Unified Theory" },
        "standing wave": { value: 43, upgrades: "spherical harmonics|superposition|surface plasmons|expansion|zero point energy|electronegativity|bremsstrahlung|cherenkov radiation|flux pinning|pair production|Penrose process" },
        "perfect diamagnetism": { value: 42, upgrades: "bremsstrahlung|cherenkov radiation|flux pinning|paramagnetism|Hall effect|eddy current|Meissner effect|ray|exchange operator" },
        "negative mass": { value: 48, upgrades: "radiative equilibrium|dynamic equilibrium|neutronium|equivalence principle|inertial mass|negative pressure|annihilation|Newtons 1st law|Newtons 2nd law|MOND" },
        "molecular assembler": { value: 50, upgrades: "flux pinning|additive manufacturing|working mass|exchange operator|pair production|endothermic|electric generator|technical intelligence|tokamak|stellarator|inertial confinement" },
        "plasma torch": { value: 41, upgrades: "tokamak|stellarator|inertial confinement|degenerate matter|dielectric|plasma jet|refractory metal|electric potential|soliton|electronvolt|cold plasma|plasma ball|corona discharge|cyclotron|plasma ring" },
        "time dilation": { value: 40, upgrades: "frame-dragging|Lorentz transformation|time crystals|no-cloning theorem|commensalism|symbiosis" },
        "metamaterial cloaking": { value: 41, upgrades: "no-cloning theorem|commensalism|symbiosis|boson composite|patch|dazzler|flanking|topological defect" },
        "pilot wave": { value: 51, upgrades: "zero point energy|electronegativity|radiative equilibrium|dynamic equilibrium|additive manufacturing|working mass|exchange operator|pair production|technical intelligence|degenerate matter|Lorentz transformation|time crystals|topological defect|hidden-variable theory|Bells theorem|principle of locality|WIMPs|vacuum fluctuation" },
        wormhole: { value: 49, upgrades: "electronegativity|WIMPs|vacuum fluctuation|anyon|transdimensional worms|Penrose process|holographic principle|manifold|geodesics|cosmic string|spaghettification|Hawking radiation|invariant|affine connection" },
        "grappling hook": { value: 53, upgrades: "Newtons 1st law|Newtons 2nd law|MOND|technical intelligence|tokamak|stellarator|inertial confinement|degenerate matter|CIWS|ground wire|swarf|reel|induction furnace|brittle" },
        portal: { value: 42, upgrades: "Lorentz transformation|time crystals|no-cloning theorem|commensalism|patch|dazzler|vacuum fluctuation|holographic principle|invariant|beam splitter|Einstein-Rosen bridge|quantum foam" },
    },
    // Each row is directional: an installed tech in the first column changes the score of an offered tech in the third.
    links: [
        ["nitinol", 15, "shape-memory|pseudoelasticity", "reward wall grabs"],
        ["tungsten carbide", 13, "seismic wave", "adds damage and stuns to hard landings"],
        ["scale invariance", 13, "bijection", "increases the skin's size bonuses"],
        ["eigenstate", -12, "entanglement|normal mode", "the pilot rarely activates its other state"],
        ["Verlet integration", 14, "barycenter|double beta decay", "adds bots or repeats the mob-death effect"],
        ["Higgs mechanism", 20, "acoustic levitation", "midair jumps the pilot can use"],
        ["Higgs mechanism", -12, "pressure vessel|railgun|pulse", "charging ties up movement"],
        ["depolarization", 21, "repolarization|hyperpolarisation", "shorten or protect the post-kill window"],
        ["CPT symmetry", 16, "causality bots|causality bombs|energy conservation|waste heat recovery|ground state", "benefit from rewinds or fuel them"],
        ["mass-energy equivalence|ionization energy", 17, "ground state|energy conservation|waste heat recovery|overcharge|energy|Casimir effect|pair production|time crystals|holographic principle|equivalence principle|infrared diode", "energy is also durability"],
        ["mass-energy equivalence", 28, "ionization energy", "converts heal drops into max energy"],
        ["mass-energy equivalence|CPT symmetry", -18, "heat engine|exothermic process|free-electron laser|surface plasmons|vacuum energy", "competes for life or rewind energy"],
        ["energy conservation|time crystals|ionization energy", 8, "electronegativity|superposition|laser-bot|Maxwells demon", "can sustain higher energy"],
        ["quenching|adiabatic healing|recycling", 10, "enthalpy|heals|self-assembly|clinical peer review|control theory|stability|fluoroantimonic acid|positive feedback", "healing supports durability or full-health effects"],
        ["Brownian ratchet", -14, "enthalpy|heals|self-assembly", "autopilot doesn't wait in healing zones"],
        ["quenching|adiabatic healing|Brownian ratchet", -15, "ergodicity", "reduced healing works against the healing build"],
        ["anthropic principle", 15, "weak anthropic principle|strong anthropic principle|ansatz|research|frequentist", "benefits from death prevention and its research reserve"],
        ["quantum immortality", 16, "self-locating uncertainty", "keep the build through death"],
        ["many-worlds|Hilbert space|Ψ(t) collapse", 11, "Banach space", "drops on a reality switch"],
        ["filament", 16, "chitin|mycelium|fiber optics|world line|correlated damage|mass production", "filament grows from drops and adds duplication"],
        ["fiber optics", 16, "optical tweezers", "the filament laser can collect power ups"],
        ["accretion", 15, "accretion disk", "power ups stay nearby and fuel damage"],
        ["accretion disk", 10, "mass production|replication|virtual particles|qubit|Casimir effect", "more drops support damage"],
        ["accretion disk", -12, "crystallography", "one rewards keeping drops around and the other clearing them"],
        ["qubit", 16, "interference", "qubits also bring damage"],
        ["Casimir effect|ionization energy", 16, "van der Waals force", "Casimir drops also improve health"],
        ["Casimir effect|ionization energy", 12, "Lie group|adiabatic healing", "more value from Casimir drops"],
        ["Casimir effect|qubit|virtual particles|exciton|enthalpy|buckling", 13, "crystallography", "clear the level's drops to multiply drop chances"],
        ["band gap|polariton|crystal lattice", 12, "exciton|dielectric", "more boosts to apply their effects"],
        ["exciton|quasiparticles|dielectric", 16, "band gap|polariton", "adds damage or defense to existing boosts"],
        ["exciton", 18, "crystal lattice", "boosted kills generate more drops"],
        ["mass production|cross-disciplinary|replication|futures exchange|vacuum fluctuation|Penrose process", 13, "correlated damage", "convert duplication into damage"],
        ["correlated damage|Penrose process", 10, "mass production|cross-disciplinary|replication|vacuum fluctuation|futures exchange", "duplication feeds the build"],
        ["mass production|correlated damage|filament", -14, "metastability|parthenogenesis|stimulated emission", "dangerous side effects on an already productive build"],
        ["options exchange", 12, "commodities exchange|futures exchange|residual dipolar coupling", "randomizing or canceling also pays out"],
        ["decoherence", 12, "coherence", "keeps previously offered choices available"],
        ["peer review|clinical peer review", 11, "frequentist|pseudoscience|research|ansatz", "research spent creates damage or healing"],
        ["Bayesian|fabrication|interest", 12, "research|ansatz|frequentist", "stocks research for damage, bots, or interest"],
        ["interest", 14, "dividend", "adds level-start ammo to the interest build"],
        ["perturbation theory", -24, "research|supply chain|pseudoscience|interest|fabrication|Bayesian", "avoid losing the fire-rate bonus or committing to a research build"],
        ["scrap bots|barycenter|causality bots|defunct", 17, "scrap refit", "refreshes existing scrap bots"],
        ["scrap bots", -15, "shear stress|thermal runaway|zoospore vector|flywheel|crystallizer", "these mob-death effects compete with scrap bot creation"],
        ["nail-bot|foam-bot|sound-bot|boom-bot|orbital-bot|dynamo-bot|laser-bot", 9, "perimeter defense|network effect|fabrication|open-source|robotics|manufacturing|BEAM robotics", "scale an existing bot fleet"],
        ["nail-bot", 14, "nail-bot upgrade", "more firing output from the fleet"],
        ["foam-bot", 14, "foam-bot upgrade", "turn the fleet into stronger foam sources"],
        ["sound-bot", 14, "sound-bot upgrade", "turn the fleet into stronger wave sources"],
        ["boom-bot", 14, "boom-bot upgrade", "stronger explosives from the fleet"],
        ["orbital-bot", 14, "orbital-bot upgrade", "stronger close-range damage from the fleet"],
        ["dynamo-bot", 14, "dynamo-bot upgrade", "turn the fleet into stronger energy sources"],
        ["laser-bot", 14, "laser-bot upgrade", "turn the fleet into more efficient laser sources"],
        ["foam-bot upgrade|foam-shot|polyurethane foam|elephants toothpaste", 14, "adhesive|electrostatic induction|necrophage|laminar flow|surface tension", "improve foam even without carrying the foam gun"],
        ["sound-bot upgrade", 14, "sympathetic resonance|anti-shear topology", "amplify the fleet's waves"],
        ["dynamo-bot upgrade|electric generator|infrared diode|dye laser", 10, "energy conservation|overcharge|ground state", "supports the existing energy supply or efficiency"],
        ["dark matter", 16, "axion|dark energy|dark star|ghost particle|entropic gravity|MACHO", "uses or improves dark matter"],
        ["MACHO", 16, "baryon|galactic halo", "strengthens the outside-dark-matter build"],
        ["Pauli exclusion|spin-statistics theorem|fermion|spin-statistics", 15, "abelian group", "turns invulnerability into damage"],
        ["mass driver|additive manufacturing|tokamak", 14, "Halbach array|inflation|restitution|flywheel|buckling|fragmentation", "gets more out of blocks already in use"],
        ["reaction inhibitor", 16, "cascading failure", "more enemies reach the finishing threshold sooner"],
        ["aperture", 14, "diaphragm", "adds defense to the oscillating damage build"],
        ["conchoidal|demineralization|thermal runaway|shear stress|zoospore vector", 9, "remineralization|demineralization|thermal runaway|shear stress", "reward continued kills"],
        ["microstates|regression", 9, "super duper|standardization|mycelial fragmentation|nail-shot|MIRV|sentry|diffraction grating", "more projectiles for damage or repeated hits"],
        ["regular tiling", -20, "aperiodic tiling", "single hits and brief attacks become less reliable"],
        ["correlated damage|junk DNA", 10, "cross-disciplinary|emergence|meta-analysis", "better choices offset the build's JUNK exposure"],
        ["dark patterns|heuristics|replication", 10, "junk DNA|meta-analysis", "get some value from the higher JUNK rate"],
        ["arsenal|active cooling|first derivative|salvo|pigeonhole principle|generalist", -26, "integrated armament|ersatz|amalgamation|sintering", "losing guns costs inventory bonuses"],
        ["arsenal|active cooling|first derivative|pigeonhole principle|generalist", 14, "ad hoc|applied science|ordnance", "more guns to generate rewards or upgrade"],
        ["integrated armament", -20, "austerity|ersatz|amalgamation|sintering", "avoid giving away the only gun"],
        ["non-renewables|quasiparticles", -26, "ammo|logistics|cache|scarcity|ideal gas law|dividend|desublimated ammunition|catabolism", "ammo drops are blocked or replaced"],
        ["cache", -12, "ideal gas law|marginal utility", "ammo already gets reset to a fixed stock"],
        ["needle gun|rivet gun", 14, "stress concentration|supercritical fission|gauge|ceramics|irradiated", "gains from needle or rivet hits"],
        ["needle gun", 16, "needle ice|nanowires|flechettes", "adds a distinct needle effect"],
        ["irradiated", 15, "polonium-210|decay chain", "extend or compound radiation from hits"],
        ["irradiated|iridium-192|cherenkov radiation|cosmic string|irradiated drones|neutron bomb|Hawking radiation", 16, "nuclear transmutation|radioactive contamination|water shielding", "radiation scaling, spread, or protection"],
        ["needle ice|ice crystal nucleation|ice-shot|cryodesiccation|cold plasma|endothermic", 15, "freezer burn|flash freeze|crystallizer|thermoelectric effect|superfluidity|triple point", "extends or capitalizes on freezes"],
        ["flux pinning|super ball|shock wave|ground wire|dazzler|cosmic string|seismic wave", 15, "fracture analysis", "stuns set up impact damage"],
        ["super ball", -13, "fatigue", "fewer original balls available to split"],
        ["liquid-propellant", 16, "hypergolic propellant|MIRV", "scales repeat missile explosions"],
        ["cruise missile", 12, "ICBM|MIRV", "build around larger missile explosions"],
        ["MIRV|incendiary ammunition|chain reaction|pulse|thermal runaway|contact explosive|supercritical fission|tokamak|fragmentation", 12, "shaped charge|ammonium nitrate|relativistic momentum|shock wave", "control splash risk or benefit from extra explosions"],
        ["ammonium nitrate|acetone peroxide|vacuum bomb|flame test|pyrotechnics|fireworks", 20, "shaped charge", "bigger blasts make self-damage protection valuable"],
        ["laser-mines|photonic crystal|laser-bot upgrade|surface plasmons", 13, "specular reflection|relativistic momentum|iridescence|infrared diode", "improves existing laser sources where eligible"],
        ["sentry", 16, "extended magazine", "more shots per mine"],
        ["siphonaptera|nematodes", 15, "K-selection|necrophage|path integration|flagella", "stronger or longer-lived pets"],
        ["cordyceps|colony", 12, "mycelial fragmentation|cryodesiccation", "improve sporangium output"],
        ["standardization|exponential growth|von Neumann probe|delivery drone|brushless motor|fault tolerance", 12, "delivery drone|path integration|brushless motor|von Neumann probe", "more opportunities for drones to collect or stay alive"],
        ["brushless motor", 17, "axial flux motor", "improves drone rushes"],
        ["irradiated drones", 16, "beta radiation|orthocyclic winding|water shielding", "improves an existing radioactive drone build"],
        ["pressure vessel|railgun|pulse|tokamak|plasma ball", 20, "capacitor bank", "shorter charge times"],
        ["capacitor bank", 12, "pressure vessel|pulse|railgun", "charge tech becomes easier to use"],
        ["surface tension|adhesive|electrostatic induction|laminar flow", 11, "necrophage|Marangoni effect|adhesive|electrostatic induction", "foam reaches and stays on mobs longer"],
        ["rebar", 16, "maul", "further upgrades the harpoon"],
        ["wear", 14, "spalling", "rewards breakage already in the build"],
        ["railgun", 16, "Bitter electromagnet", "more railgun charge rate and damage"],
        ["UHMWPE|Bessemer process", 13, "logistics|cache|scarcity", "harpoon power depends on ammo stock"],
        ["UHMWPE|induction furnace|optical tweezers", -16, "alternator|railgun|pulse", "changing weapon modes can lose pickup utility"],
        ["diffraction grating", 16, "collimator|specular reflection", "scale multiple beams"],
        ["diffuse beam", 16, "output coupler", "scale the wide beam"],
        ["lens", 14, "compound lens", "increases lens coverage and damage"],
        ["pulse", 16, "specular reflection|diffuse beam|shaped charge", "improves pulse explosions or safety"],
        ["bremsstrahlung", 16, "cherenkov radiation", "make deflections radioactive"],
        ["equivalence principle", 15, "negative pressure|Newtons 1st law|Newtons 2nd law", "free flight keeps mobility effects usable"],
        ["Newtons 1st law|Newtons 2nd law", 18, "MOND|Newtons 1st law|Newtons 2nd law", "more speed counts toward damage and defense"],
        ["tokamak", 14, "stellarator|inertial confinement", "reward or fly with charged blocks"],
        ["electric potential|refractory metal", 12, "electronvolt|plasma jet|soliton|cold plasma", "strengthen the plasma stream"],
        ["Bells theorem", 17, "principle of locality|electronegativity|hidden-variable theory", "the pilot wave stays on without draining energy"],
        ["holographic principle|affine connection", 14, "manifold|geodesics|cosmic string|spaghettification|anyon|transdimensional worms", "a usable wormhole has more ways to pay off"],
        ["invariant", -13, "manifold|geodesics|cosmic string|spaghettification|affine connection", "autopilot skips some wormhole moves with invariant"],
        ["topological defect", 12, "flanking|brittle", "stack opening-hit damage on untouched mobs"],
        ["vacuum energy", -20, "mass-energy equivalence|CPT symmetry|free-electron laser|heat engine", "randomly losing all energy is costly"],
        ["a priori", 11, "cross-disciplinary|emergence", "more choices can generate matching upgrades"],
        ["determinism|superdeterminism", -20, "open-source|emergence|cross-disciplinary|options exchange", "a restrictive draft reduces choice value"],
    ],
    // General priorities and risks that don't require an installed tech.
    preferences: [
        [19, "nitinol|acoustic levitation|equivalence principle|ray|affine connection|holographic principle|delivery drone|ice crystal nucleation|quenching|energy conservation|a priori|emergence"],
        [12, "nail-bot|foam-bot|sound-bot|boom-bot|orbital-bot|dynamo-bot|Klemperer rosette|control theory|stability|non-Newtonian|torpor|remineralization|quantum immortality|CPT symmetry|mass production|crystallography|options exchange|reaction inhibitor|conchoidal|filament|standardization|infrared diode|UHMWPE|principle of locality|tessellation|no-cloning theorem|counterfactual|ad hoc|applied science|path integral|meta-analysis"],
        [-13, "Brownian ratchet|alternator|railgun|brainstorming|dynamical systems|repeater|slime|cavitation|frame-dragging|paramagnetism|inertial confinement|working mass|pressure vessel|rocket-propelled grenade|bound state|free-electron laser|aerogel|dead reckoning|aerostat|decorrelation|anticorrelation|mutualism|Zenos paradox|zeitgeist|paradigm shift|quintessence"],
        [-24, "determinism|superdeterminism|metastability|parthenogenesis|stimulated emission|planned obsolescence|Born rule|Occams razor|fine-tuned universe|vacuum energy|Hilbert space|Ψ(t) collapse|invariant|catabolism|Pareto efficiency"],
        [-65, "WIMPs|quantum Zeno effect|tungsten carbide|inductive charging|neutron bomb|irradiated drones|Hawking radiation|acetone peroxide|antiscience|fine-structure constant|Newtons 3rd law|eddy current|inertial mass|plasma ball|boson composite|eigenstate|exchange operator|Majorana fermion"],
    ],
    // Routes with concrete follow-ups. The forecast is a preference for starting a build, not a change to draft odds.
    branches: {
        nitinol: "shape-memory|pseudoelasticity",
        "Higgs mechanism": "acoustic levitation",
        depolarization: "repolarization|hyperpolarisation",
        "CPT symmetry": "causality bots|causality bombs",
        "mass-energy equivalence": "ionization energy",
        "dark matter": "axion|dark energy|dark star|ghost particle|entropic gravity|MACHO",
        "anthropic principle": "weak anthropic principle|strong anthropic principle",
        filament: "chitin|mycelium|fiber optics|world line",
        exciton: "band gap|polariton|crystal lattice",
        "Casimir effect": "van der Waals force|crystallography",
        "options exchange": "commodities exchange|futures exchange|residual dipolar coupling",
        "needle gun": "needle ice|nanowires|ceramics",
        "ice crystal nucleation": "freezer burn|flash freeze|thermoelectric effect",
        "liquid-propellant": "hypergolic propellant",
        "brushless motor": "axial flux motor",
        "diffraction grating": "collimator",
        "diffuse beam": "output coupler",
        lens: "compound lens",
        bremsstrahlung: "cherenkov radiation",
    },
    doNotTake: new Map([
        ["many-worlds", "scrambles the build at the start of each level"],
        ["Bells theorem", "the always-on pilot wave can get stuck out of reach"],
    ]),
    gearWeight: 1.8, //gun, field, and skin tech score this many times a normal tech before everything else
    has(list, name) {
        return list.split("|").includes(name)
    },
    currentBuild() {
        const owned = new Map(tech.tech.filter(t => t.count > 0).map(t => [t.name, t.count]))
        const guns = b.inventory.map(i => b.guns[i])
        const gun = b.guns[b.activeGun]
        const field = autopilot.fieldName()
        const energy = m.maxEnergy > 0 ? Math.max(0, Math.min(1, m.energy / m.maxEnergy)) : 0
        const health = tech.isEnergyHealth ? energy : m.maxHealth > 0 ? Math.max(0, Math.min(1, m.health / m.maxHealth)) : 0
        const ammo = autopilotBuild.ammoStock(gun)
        return { owned, guns, gun, field, energy, health, ammo, research: powerUps.research.count, bots: b.totalBots() }
    },
    ammoStock(gun) {
        if (!gun || !gun.ammo) return 0
        return gun.ammo === Infinity ? Infinity : gun.ammo / Math.max(1, gun.ammoPack)
    },
    score(type, option, run = autopilotBuild.currentBuild()) {
        const rules = autopilotBuild
        const name = option.name
        const excluded = type === "tech" && rules.doNotTake.get(name)
        if (excluded) {
            return { score: -Infinity, reasons: [{ points: -Infinity, reason: excluded }] }
        }
        const reasons = []
        let score = 0
        const add = (points, reason) => {
            if (!points) return
            score += points
            reasons.push({ points, reason })
        }
        if (type === "gun") {
            const value = rules.gunValue(option, run)
            add(value, "gun fit")
            if (run.field === "portal") add(-65, "portal disables guns")
            else if (!run.guns.length) add(74, "first gun")
            else if (tech.isOneGun) {
                add(-rules.gunValue(run.gun, run) - 13, "integrated armament replaces the current gun")
                if (run.ammo === 0) add(46, "replace an empty gun")
            } else if (!run.guns.some(g => g.ammo > 0)) add(38, "no loaded guns")
            else if (run.ammo < 3) add(18, "active gun is low on ammo")
            if (run.guns.length && !tech.isOneGun) {
                if (tech.isDamageForGuns || tech.isFireRateForGuns || tech.isGunChoice || tech.isGunCycle || tech.isSecondShot) add(29, "inventory tech benefits from more guns")
                if (run.owned.has("austerity")) add(-22, "a gun ends austerity's future level-start bonus")
                if (!run.guns.some(g => g.ammo === Infinity) && option.ammoPack === Infinity) add(15, "first gun that can run without ammo drops")
            }
            if (tech.isExtraGunTech) add(12, "a priori adds a matching tech")
            return { score, reasons }
        }
        if (type === "field") {
            add(rules.fieldValue(name, run), "new field fit")
            add(-rules.fieldValue(run.field, run) - 3, "give up the current field")
            if (tech.isExtraGunTech) add(10, "a priori adds a matching tech")
            if (tech.isEnergyHealth && run.health < 0.4) add(24, "switching fields refills energy and durability")
            return { score, reasons }
        }
        if (option.isJunk) {
            add(tech.isMetaAnalysis ? 24 : -100, tech.isMetaAnalysis ? "meta-analysis replaces JUNK with random tech and research" : "JUNK")
            return { score, reasons }
        }
        const isGear = option.isGunTech || option.isFieldTech || option.isSkin || option.isSkinUpgrade //tech for its gun or field, a skin, or tech for its skin, these usually give about twice the reward
        add(isGear ? 32 * rules.gearWeight : 32, isGear ? "gun, field, or skin tech" : "tech")
        if (option.isSkin && tech.isExtraGunTech) add(8, "a priori adds a matching tech")
        if (option.isInput) add(-24, "needs manual input")
        if (option.isBadRandomOption) add(-8, "high-variance or situational tech")
        if (option.isRemoveBenefit) add(-16, "main reward requires ejecting the tech")
        if (option.isRemoveGun) add(run.guns.length < 2 ? -25 : -9, "trades away a gun")
        if (option.isBot) add(Math.min(15, 4 * run.bots), "supports the bot build")
        if (name.endsWith("-bot upgrade")) add(20 + Math.min(12, 2 * run.bots), "upgrades the bot fleet")
        if (option.isBotTech && !option.isBot) add(Math.min(12, 2 * run.bots), "benefits from existing bots")
        if (option.isHealTech && run.health < 0.45) add(12, "low durability")
        if (option.isGunTech && !option.isBotTech && run.field === "portal" &&
            rules.has(rules.guns[run.gun?.name]?.upgrades || "", name) && !rules.has(rules.fields[run.field]?.upgrades || "", name)) {
            add(-28, "portal disables guns")
        }
        if (option.isGunTech && run.gun && run.ammo === 0 && rules.has(rules.guns[run.gun.name]?.upgrades || "", name) &&
            name !== "ice crystal nucleation") add(-8, "matching gun is out of ammo")
        for (const [points, names] of rules.preferences) {
            if (rules.has(names, name)) add(points, "autopilot preference")
        }
        for (const [sources, points, targets, reason] of rules.links) {
            if (rules.has(targets, name) && sources.split("|").some(source => source !== name && run.owned.has(source))) add(points, reason)
        }
        if (option.count === 0 && rules.branches[name]) {
            const followUps = rules.branches[name].split("|").filter(target => !run.owned.has(target))
            add(Math.min(9, followUps.length * 3), "opens or supports " + followUps.join(", "))
        }
        rules.scoreTech(name, run, add)
        add(-Math.min(12, 2 * option.count), "prefer new effects over many stacks")
        return { score, reasons }
    },
    rerollForecast(type, current, { researchCost = 0, extraJunkChance = 0, expanded = false, floor = 0 } = {}) {
        // Some upgrades become ineligible when research is spent. Preview the balance without firing any spend effects.
        const previousResearch = powerUps.research.count
        powerUps.research.count -= researchCost
        try {
            return autopilotBuild.previewDraft(type, current, expanded, floor, extraJunkChance)
        } finally {
            powerUps.research.count = previousResearch
        }
    },
    previewDraft(type, current, expanded, floor, extraJunkChance) {
        const { items, options, totalChoices } = powerUps.draftPool(type, expanded)
        if (!options.length && type !== "gun") return null //this reroll might fail to produce a new menu
        const run = autopilotBuild.currentBuild()
        const techScores = new Map()
        const techScore = i => {
            if (!techScores.has(i)) techScores.set(i, autopilotBuild.score("tech", tech.tech[i], run).score)
            return techScores.get(i)
        }
        const isTech = type === "tech"
        let guaranteed = floor
        const retained = new Set()
        if (isTech && tech.isRetain) {
            const names = new Set(powerUps.retainList)
            for (let i = 0; i < items.length; i++) {
                const t = items[i]
                if (names.has(t.name) && t.count < t.maxCount && t.allowed() && t.frequency > 0) {
                    retained.add(i)
                    guaranteed = Math.max(guaranteed, techScore(i))
                }
            }
        }
        if (isTech && tech.isMassProduction) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].isMassProduction) guaranteed = Math.max(guaranteed, techScore(i))
            }
        }
        if (type === "gun" && options.length === 0) {
            const ammo = tech.tech.findIndex(t => t.name === "ammo" && t.count < t.maxCount)
            if (ammo < 0 && tech.isSuperDeterminism) return null
            if (ammo >= 0) guaranteed = Math.max(guaranteed, techScore(ammo))
        }
        const weighted = options.filter(i => !retained.has(i))
        const scores = new Map()
        for (const i of new Set(weighted)) {
            scores.set(i, isTech ? techScore(i) : autopilotBuild.score(type, items[i], run).score)
        }
        const scoreOptions = (kind, list) => list.map(item => autopilotBuild.score(kind, item, run).score)
        const extraGuns = isTech && tech.isExtraGunField ? scoreOptions("gun", b.guns.filter(gun => !gun.have)) : []
        const extraFields = isTech && tech.isExtraGunField ?
            scoreOptions("field", m.fieldUpgrades.filter((field, i) => i && i !== m.fieldMode && !field.isLoreField)) : []
        const bots = powerUps.botDraftOptions()
        const junkChance = isTech ? Math.min(1, (tech.junkChance || 0) + (level.junkAdded || 0) + extraJunkChance) : 0
        const junkScore = tech.isMetaAnalysis ? 24 : -100
        // Estimate the best card across possible drafts without advancing either of the game's random streams.
        let seed = 347129
        const randomIndex = length => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
            return Math.floor(seed / 4294967296 * length)
        }
        const results = []
        for (let sample = 0; sample < 160; sample++) {
            let best = guaranteed, pool = weighted.slice()
            const drawn = new Set()
            for (let draw = 0; draw < totalChoices && pool.length; draw++) {
                if (junkChance > 0 && randomIndex(10000) < junkChance * 10000) {
                    best = Math.max(best, junkScore)
                } else {
                    const index = pool[randomIndex(pool.length)]
                    best = Math.max(best, scores.get(index))
                    drawn.add(index)
                    pool = pool.filter(i => i !== index)
                }
            }
            const botOptions = isTech ? bots.filter(i => !drawn.has(i)) : bots
            if (botOptions.length) best = Math.max(best, techScore(botOptions[randomIndex(botOptions.length)]))
            const extra = extraGuns.length && (!extraFields.length || randomIndex(2)) ? extraGuns : extraFields
            if (extra.length) best = Math.max(best, extra[randomIndex(extra.length)])
            results.push(best)
        }
        results.sort((a, b) => a - b)
        return {
            typical: results[results.length >> 1],
            expected: results.reduce((sum, score) => sum + score, 0) / results.length,
            chanceBetter: results.filter(score => score > current).length / results.length,
        }
    },
    gunValue(gun, run) {
        if (!gun) return 0
        const rules = autopilotBuild
        const { value, upgrades } = rules.guns[gun.name] || { value: 8, upgrades: "" }
        // Integrated armament replacement should value keeping the active gun's upgrades, not expect them to carry over to its replacement.
        const fit = tech.isOneGun && gun !== run.gun ? 0 : upgrades.split("|").reduce((sum, name) => sum + (run.owned.get(name) || 0), 0)
        const usesAmmo = gun.ammoPack !== Infinity && gun.ammo !== Infinity
        let result = value + Math.min(21, 4 * fit)
        if (usesAmmo && (tech.isEnergyNoAmmo || tech.isBoostReplaceAmmo)) result -= gun.name === "harpoon" && gun.mode !== "railgun" ? 10 : 30
        if (gun.name === "laser") {
            if (run.energy < 0.3) result -= 17
            if (tech.isEnergyHealth) result -= 10
            if (run.owned.has("energy conservation") || run.owned.has("time crystals")) result += 12
            if (tech.isLaserGrabPowerUp) result += 6
        }
        if (gun.name === "harpoon" && gun.mode === "stab") {
            if (run.field === "grappling hook") result -= 4
            if (run.owned.has("induction furnace") || run.owned.has("UHMWPE")) result += 7
        }
        if (gun.name === "drones" && tech.isDroneGrab) result += 7
        return result
    },
    fieldValue(name, run) {
        const { value, upgrades } = autopilotBuild.fields[name] || { value: 25, upgrades: "" }
        const fit = upgrades.split("|").reduce((sum, name) => sum + Math.min(3, run.owned.get(name) || 0), 0)
        let result = value + Math.min(52, 9 * fit)
        if (name === "portal" && run.guns.length) result -= 37 + Math.min(22, run.guns.length * 6)
        if (name === "standing wave" && tech.isEnergyHealth) result += 9
        if (name === "standing wave" && run.owned.has("CPT symmetry")) result -= 20
        if (name === "field emitter" && tech.isGUT) result += 20
        if (tech.isEnergyHealth && (name === "negative mass" || name === "grappling hook" || name === "plasma torch")) result -= run.energy < 0.5 ? 12 : 5
        if (name === "grappling hook" && !autopilot.isGrapple) result -= 12
        if (name === "wormhole" && (!autopilot.isWarp || tech.isWormHolePause)) result -= 14
        if (name === "portal" && tech.isWormHolePause) result -= 10
        return result
    },
    scoreTech(name, run, add) {
        const isAmmoBuild = run.guns.some(g => g.ammoPack < Infinity)
        if (name === "non-renewables" || name === "quasiparticles") {
            const sustainable = run.gun?.ammo === Infinity || (run.gun?.name === "harpoon" && run.gun.mode === "stab" && run.gun.ammo > 0 && !tech.isBreakHarpoon)
            add(sustainable ? 12 : -75, sustainable ? "equipped gun can run without ammo drops" : "equipped gun needs ammo drops")
            if (sustainable && isAmmoBuild && run.guns.length > 1) add(-8, "backup guns still need ammo")
        }
        if (name === "mass-energy equivalence") {
            add(tech.isEnergyHealth || run.energy < 0.4 ? -15 : 0, "low starting energy")
            if (run.owned.has("energy conservation") || run.owned.has("ground state") || run.owned.has("time crystals")) add(15, "energy build can support energy as health")
            if (run.owned.has("quenching") || run.owned.has("recycling")) add(-16, "gives up normal healing")
        }
        if (name === "anthropic principle") add(24 + (run.health < 0.5 ? 8 : 0), "death prevention")
        if (name === "ice crystal nucleation" && run.ammo < 3) add(16, "restores a gun that is low on ammo")
        if (name === "Bayesian") add(Math.min(20, 3 * run.research), "banked research adds damage")
        if (name === "peer review" || name === "clinical peer review") add(Math.min(12, 2 * run.research), "research available to spend")
        if (name === "double beta decay") add(7 + Math.min(14, 3 * tech.tech.filter(t => t.isMobDeathTech && t.count > 0).length), "repeats existing mob-death effects")
        if (name === "perimeter defense" || name === "network effect" || name === "open-source") add(Math.min(15, 3 * run.bots), "established bot fleet")
        if (name === "ammo" || name === "cache" || name === "scarcity" || name === "logistics" || name === "ideal gas law" || name === "marginal utility") {
            if (!isAmmoBuild || tech.isEnergyNoAmmo || tech.isBoostReplaceAmmo) add(-60, "little or no use for ammo")
            else if (run.ammo < 3) add(15, "low ammo")
        }
        if (name === "heals") {
            const value = powerUps.healGiveMaxEnergy ? 20 : tech.isEnergyHealth ? -55 : run.health < 0.45 ? 30 :
                run.health > 0.9 && !tech.isOverHeal ? -28 : 0
            add(value, "heal pickup value")
        }
        if (name === "energy" && tech.isEnergyHealth) add(15, "raises energy and durability")
        if (name === "Grand Unified Theory") add(run.guns.length ? 9 : -42, "converts future gun and field drops to coupling")
        if (name === "austerity" && !run.guns.length) add(run.bots >= 3 ? 10 : -15, "gunless combat needs another damage source")
        if (name === "salvo") add(run.guns.filter(g => g.ammo > 0).length >= 2 ? 14 : -16, "salvo needs loaded guns")
        if (name === "plasma-bot" && run.field === "plasma torch") add(run.guns.length ? -10 : -35, "trades plasma torch for a bot")
        if (name === "transverse" && run.owned.has("sympathetic resonance")) add(-24, "transverse stops producing the longitudinal waves that trigger this upgrade")
        if (name === "sympathetic resonance" && run.gun?.name === "wave" && tech.isTransverse && !tech.isSoundBotUpgrade) {
            add(-24, "transverse waves don't trigger this upgrade")
        }
        if (name === "ternary" && run.gun?.ammo === Infinity) add(-35, "unlimited ammo can't trigger ternary")
        if (name === "stability" || name === "control theory") add((run.health > 0.9 ? 7 : run.health < 0.5 ? -12 : 0), "full durability required")
        if (name === "homeostasis" || name === "negative feedback") add(run.health < 0.5 ? 14 : 0, "benefits from missing durability")
        if (name === "research" && tech.isRerollHaste) add(-30, "more than one research ejects perturbation theory")
        if (name === "ersatz" || name === "amalgamation" || name === "sintering") {
            add(run.guns.length === 1 ? -34 : run.bots >= 4 ? 12 : 0, "trade guns for a bot fleet or a permanent bonus")
        }
        if (name === "mutualism" && tech.isEnergyHealth) add(-14, "spores borrow energy used as durability")
        if (name === "logistics" && !Number.isFinite(run.ammo)) add(-27, "logistics can't refill backup guns while the active gun has unlimited ammo")
    },
    pickupValue(who) {
        const field = autopilot.fieldName()
        switch (who.name) {
            case "difficulty":
                return 0
            case "heal": {
                const health = m.health / m.maxHealth
                if (tech.isEnergyHealth || (health >= 0.95 && !tech.isOverHeal)) return 0
                return health < 0.3 ? 4.5 : health < 0.7 ? 2.7 : tech.isOverHeal ? 1.55 : 1
            }
            case "ammo": {
                if (tech.isEnergyNoAmmo || !b.inventory.length) return 0
                const gun = b.guns[b.activeGun]
                const cap = tech.ammoCap ? tech.ammoCap * (tech.isAmmoForGun ? 2 : 1) *
                    (field === "field emitter" || field === "grappling hook" ? 1 + 0.05 * m.coupling : 1) : Infinity
                let value = 0
                for (const index of b.inventory) {
                    const recipient = b.guns[index]
                    if (tech.isAmmoForGun && gun && recipient !== gun) continue
                    const stock = autopilotBuild.ammoStock(recipient)
                    if (stock >= cap) continue
                    let need = recipient === gun && stock === 0 ? 3.2 : stock < 3 ? 1.85 : stock < 12 ? 1 : 0.6
                    if (recipient !== gun) need *= 0.65
                    if (recipient.name === "harpoon" && tech.isUHMWPE) need += 0.35
                    if (field === "portal") need *= 0.3
                    value = Math.max(value, need)
                }
                return value
            }
            case "gun": {
                if (field === "portal") return 0.45
                if (!b.inventory.length) return 4
                const stock = autopilotBuild.ammoStock(b.guns[b.activeGun])
                if (tech.isOneGun) return stock === 0 ? 2.5 : 0.65
                return (b.inventory.length === b.guns.length ? 0.55 : 1.25) + (stock < 3 ? 0.5 : 0) +
                    (tech.isExtraGunTech || tech.isDamageForGuns || tech.isFireRateForGuns || tech.isGunChoice || tech.isGunCycle || tech.isSecondShot ? 0.5 : 0)
            }
            case "field":
                return (tech.isEnergyHealth && m.energy < 0.4 * m.maxEnergy ? 2.6 :
                    field === "field emitter" || field === "portal" ? 1.65 : 0.95) + (tech.isExtraGunTech ? 0.35 : 0)
            case "tech": {
                const health = tech.isEnergyHealth ? m.energy / m.maxEnergy : m.health / m.maxHealth
                return tech.isTechDamage && health < 0.35 ? 0.45 : 1.8
            }
            case "research": {
                const research = powerUps.research.count
                if (tech.isRerollHaste && research >= 1) return 0
                if (tech.isDeathAvoid && !tech.isDeathAvoidedThisLevel && research === 0) return 3.2
                return tech.isRerollBots || tech.isRerollDamage || tech.isResearchDamage || tech.isResearchHeal || tech.isFrequentist || tech.interestRate > 0 ? 1.65 : 1.1
            }
            case "Casimir":
                return tech.isEnergyHealth ? (m.energy < 0.45 * m.maxEnergy ? 3.5 : 2.25) :
                    (b.guns[b.activeGun]?.name === "laser" || tech.isRewindAvoidDeath || tech.isCasimirHealth || powerUps.healGiveMaxEnergy ? 1.9 : 1.25)
            case "coupling":
                return field === "field emitter" || tech.isGUT || (field === "grappling hook" && b.guns[b.activeGun]?.ammo < Infinity) ? 1.4 : 1.05
            case "qubit":
                return tech.isQubitDamage ? 1.85 : 1.25
            case "boost": {
                const boost = powerUps.boost
                const active = boost.endCycle - simulation.cycle
                return active > boost.duration * 0.75 ? 0.75 : boost.isDefense || tech.isCrystalLattice || boost.damage > 1.25 ? 1.7 : 1.15
            }
            default:
                return 1
        }
    },
}
