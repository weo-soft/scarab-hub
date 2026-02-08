/**
 * Grid Configuration
 * Defines cell positions based on the Scarab-tab.png image analysis
 * Image dimensions: 825 x 787 pixels
 * 
 * Default cell size: 49x48 pixels
 * Default padding between cells in a group: 2 pixels
 * 
 * Format: { x, y, count, cellWidth?, cellHeight?, padding? }
 * - x, y: top-left corner of the group
 * - count: number of cells in that group
 * - cellWidth (optional): override default cell width for this group
 * - cellHeight (optional): override default cell height for this group
 * - padding (optional): override default padding for this group
 * 
 * Example with overrides:
 * { x: 151, y: 24, count: 3, cellWidth: 50, padding: 3 }
 */

/**
 * Cell group definitions
 * Each entry represents a group of cells with their starting position and count.
 * Optional properties allow per-group customization of cell dimensions and padding.
 */
/**
 * Scarab type to group mapping
 * Maps scarab type keywords (from id/name) to group indices
 * Used for explicit scarab-to-cell assignment
 */
export const SCARAB_TYPE_TO_GROUP = {
  'titanic': 0,
  'sulphite': 1,
  'divination': 2,
  'anarchy': 3,
  'ritual': 4,
  'harvest': 5,
  'kalguuran': 6,
  'influencing': 7,
  'bestiary': 8,
  'harbinger': 9,
  'betrayal': 10,
  'incursion': 11,
  'domination': 12,
  'torment': 13,
  'cartography': 14,
  'beyond': 15,
  'ambush': 16,
  'ultimatum': 17,
  'expedition': 18,
  'delirium': 19,
  'legion': 20,
  'blight': 21,
  'abyss': 22,
  'essence': 23,
  'breach': 24,
  'misc': 25, // Misc1
  'horned': 26, // Horned1
  'misc2': 27, // Misc2 (if needed)
  'horned2': 28, // Horned2 (if needed)
};

/**
 * Explicit scarab ordering within groups
 * Maps group type to ordered array of scarab IDs (left to right)
 * If a group type is not specified, scarabs are sorted by value (low to high)
 * 
 * Format: { [groupType]: [scarabId1, scarabId2, ...] }
 */
export const SCARAB_ORDER_CONFIG = {
  'titanic': [
    'titanic-scarab',              // Base
    'titanic-scarab-of-treasures', // .. of Treasures
    'titanic-scarab-of-legend',    // .. of Legend
  ],
  'sulphite': [
    'sulphite-scarab',        // Base
    'sulphite-scarab-of-fumes', // .. of Fumes
  ],
  'divination': [
    'divination-scarab-of-the-cloister', // .. of The Cloister
    'divination-scarab-of-plenty',       // .. of Plenty
    'divination-scarab-of-pilfering',    // .. of Pilfering
  ],
  'anarchy': [
    'anarchy-scarab',                    // Base
    'anarchy-scarab-of-gigantification', // .. of Gigantification
    'anarchy-scarab-of-partnership',     // .. of Partnership
  ],
  'ritual': [
    'ritual-scarab-of-selectiveness', // .. of Selectiveness
    'ritual-scarab-of-wisps',         // .. of Wisps
    'ritual-scarab-of-abundance',     // .. of Abundance
  ],
  'harvest': [
    'harvest-scarab',                  // Base
    'harvest-scarab-of-doubling',      // .. of Doubling
    'harvest-scarab-of-cornucopia',    // .. of Cornucopia
  ],
  'kalguuran': [
    'kalguuran-scarab',                        // Base
    'kalguuran-scarab-of-guarded-riches',      // .. of Guarded Riches
    'kalguuran-scarab-of-refinement',         // .. of Refinement
  ],
  'influencing': [
    'influencing-scarab-of-the-shaper',  // .. of the Shaper
    'influencing-scarab-of-the-elder',   // .. of the Elder
    'influencing-scarab-of-hordes',      // .. of Hordes
    'influencing-scarab-of-conversion',   // .. of Conversion
  ],
  'bestiary': [
    'bestiary-scarab',                    // Base
    'bestiary-scarab-of-the-herd',        // .. of the Herd
    'bestiary-scarab-of-duplicating',     // .. of Duplicating
  ],
  'harbinger': [
    'harbinger-scarab',                   // Base
    'harbinger-scarab-of-obelisks',      // .. of Obelisks
    'harbinger-scarab-of-regency',       // .. of Regency
    'harbinger-scarab-of-warhoards',     // .. of Warhoards
  ],
  'betrayal': [
    'betrayal-scarab',                    // Base
    'betrayal-scarab-of-the-allflame',    // The Allflame
    'betrayal-scarab-of-reinforcements',  // .. of Reinforcements
  ],
  'incursion': [
    'incursion-scarab',                   // Base
    'incursion-scarab-of-invasion',      // .. of Invasion
    'incursion-scarab-of-champions',     // .. of Champions
    'incursion-scarab-of-timelines',     // .. of Timelines
  ],
  'domination': [
    'domination-scarab',                  // Base
    'domination-scarab-of-apparitions',  // .. of Apparitions
    'domination-scarab-of-evolution',    // .. of Evolution
    'domination-scarab-of-terrors',      // .. of Terrors
  ],
  'torment': [
    'torment-scarab',                     // Base
    'torment-scarab-of-peculiarity',      // .. of Peculiarity
    'torment-scarab-of-possession',      // .. of Possession
  ],
  'cartography': [
    'cartography-scarab-of-escalation',   // Escalation
    'cartography-scarab-of-risk',         // Risk
    'cartography-scarab-of-corruption',   // Corruption
    'cartography-scarab-of-the-multitude', // Multitude
  ],
  'beyond': [
    'beyond-scarab',                      // Base
    'beyond-scarab-of-haemophilia',       // Haemophilia
    'beyond-scarab-of-resurgence',       // Resurgence
    'beyond-scarab-of-the-invasion',      // Invasion
  ],
  'ambush': [
    'ambush-scarab',                                      // Base
    'ambush-scarab-of-hidden-compartments',               // Hidden Compartments
    'ambush-scarab-of-potency',                          // Potency
    'ambush-scarab-of-containment',                      // Containment
    'ambush-scarab-of-discernment',                      // Discernment
  ],
  'ultimatum': [
    'ultimatum-scarab',                    // Base
    'ultimatum-scarab-of-bribing',        // Bribing
    'ultimatum-scarab-of-dueling',        // Dueling
    'ultimatum-scarab-of-catalysing',     // Catalysing
    'ultimatum-scarab-of-inscription',    // Inscription
  ],
  'expedition': [
    'expedition-scarab',                           // Base
    'expedition-scarab-of-runefinding',           // Runefinding
    'expedition-scarab-of-verisium-powder',       // Verisium Powder
    'expedition-scarab-of-archaeology',           // Archaeology
  ],
  'delirium': [
    'delirium-scarab',                    // Base
    'delirium-scarab-of-mania',          // Mania
    'delirium-scarab-of-paranoia',       // Paranoia
    'delirium-scarab-of-neuroses',       // Neuroses
    'delirium-scarab-of-delusions',      // Delusions
  ],
  'legion': [
    'legion-scarab',                              // Base
    'legion-scarab-of-officers',                  // Officers
    'legion-scarab-of-command',                   // Command
    'legion-scarab-of-eternal-conflict',          // Eternal Conflict
  ],
  'blight': [
    'blight-scarab',                      // Base
    'blight-scarab-of-the-blightheart',   // Blightheart
    'blight-scarab-of-blooming',         // Blooming
    'blight-scarab-of-invigoration',     // Invigoration
  ],
  'abyss': [
    'abyss-scarab',                       // Base
    'abyss-scarab-of-multitudes',        // Multitudes
    'abyss-scarab-of-edifice',           // Edifice
    'abyss-scarab-of-profound-depth',     // Profound Depth
  ],
  'essence': [
    'essence-scarab',                     // Base
    'essence-scarab-of-ascent',          // Ascent
    'essence-scarab-of-stability',       // Stability
    'essence-scarab-of-calcification',    // Calcification
    'essence-scarab-of-adaptation',      // Adaptation
  ],
  'misc': [
    'scarab-of-monstrous-lineage',       // Monstrous Lineage
    'scarab-of-adversaries',              // Adversaries
    'scarab-of-divinity',                // Divinity
    'scarab-of-hunted-traitors',         // Traitors
  ],
  'misc2': [
    'scarab-of-stability',                // Stability
    'scarab-of-wisps',                    // Wisps
    'scarab-of-radiant-storms',           // Radiant Storms
    'scarab-of-bisection',                // Bisection
  ],
  'breach': [
    'breach-scarab',                      // Base
    'breach-scarab-of-lordship',          // Lordship
    'breach-scarab-of-splintering',      // Splintering
    'breach-scarab-of-snares',            // Snares
    'breach-scarab-of-resonant-cascade',  // Resonant Cascade
  ],
  'horned': [
    'horned-scarab-of-bloodlines',        // Bloodlines
    'horned-scarab-of-nemeses',           // Nemeses
    'horned-scarab-of-preservation',      // Preservation
    'horned-scarab-of-awakening',         // Awakening
    'horned-scarab-of-tradition',         // Tradition
  ],
  'horned2': [
    'horned-scarab-of-glittering',        // Glittering
    'horned-scarab-of-pandemonium',       // Pandemonium
  ],
  // Add more group orderings as needed
};

/**
 * Grid configuration for catalysts-tab.png
 * Image dimensions: 844 x 839 pixels (from poedata layout)
 * Symbol slots: 1 top, 4 second row, 6 third row = 11 catalysts. Order by MLE weight (high = common first).
 * Weight data: https://poedata.dev/data/catalysts/calculations/mle.json
 */
export const CATALYSTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/catalysts-tab.png',
  imageDimensions: {
    width: 844,
    height: 839
  },
  cellGroups: [
    // Top slot (1 cell)
    { x: 391, y: 48, count: 1, type: 'catalyst' },
    // Second row (4 cells)
    { x: 257, y: 135, count: 1, type: 'catalyst' },
    { x: 346, y: 135, count: 1, type: 'catalyst' },
    { x: 434, y: 135, count: 1, type: 'catalyst' },
    { x: 522, y: 135, count: 1, type: 'catalyst' },
    // Third row (6 cells, left 3 + right 3 with gap for central slot)
    { x: 97, y: 230, count: 1, type: 'catalyst' },
    { x: 185, y: 230, count: 1, type: 'catalyst' },
    { x: 272, y: 230, count: 1, type: 'catalyst' },
    { x: 508, y: 230, count: 1, type: 'catalyst' },
    { x: 593, y: 230, count: 1, type: 'catalyst' },
    { x: 680, y: 230, count: 1, type: 'catalyst' }
  ],
  defaultCellSize: {
    width: 60,
    height: 60
  },
  defaultPadding: 2,
  // Order by MLE weight descending (common first). Tainted not in MLE, placed last.
  itemOrderConfig: {
    catalyst: [
      'tainted-catalyst',
      'abrasive-catalyst',
      'tempering-catalyst',
      'fertile-catalyst',
      'accelerating-catalyst',
      'unstable-catalyst',
      'turbulent-catalyst',
      'imbued-catalyst',
      'prismatic-catalyst',
      'intrinsic-catalyst',
      'noxious-catalyst',
    ]
  }
};

/**
 * Grid configuration for fossils-tab.png
 * Image dimensions: 839 x 839 pixels (from poedata layout)
 * Weight data: https://poedata.dev/data/fossils/calculations/mle.json
 */
export const FOSSILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fossils-tab.png',
  imageDimensions: {
    width: 839,
    height: 839
  },
  cellGroups: [
    // Top Row - 7 cells
    { x: 124, y: 67, count: 1, type: 'fossil' },
    { x: 212, y: 67, count: 1, type: 'fossil' },
    { x: 300, y: 67, count: 1, type: 'fossil' },
    { x: 388, y: 67, count: 1, type: 'fossil' },
    { x: 476, y: 67, count: 1, type: 'fossil' },
    { x: 565, y: 65, count: 1, type: 'fossil' },
    { x: 652, y: 64, count: 1, type: 'fossil' },
    // Second Row - 9 cells
    { x: 34, y: 155, count: 1, type: 'fossil' },
    { x: 124, y: 155, count: 1, type: 'fossil' },
    { x: 212, y: 155, count: 1, type: 'fossil' },
    { x: 299, y: 155, count: 1, type: 'fossil' },
    { x: 386, y: 155, count: 1, type: 'fossil' },
    { x: 475, y: 155, count: 1, type: 'fossil' },
    { x: 563, y: 155, count: 1, type: 'fossil' },
    { x: 652, y: 155, count: 1, type: 'fossil' },
    { x: 742, y: 155, count: 1, type: 'fossil' },
    // Third Row - 7 cells
    { x: 78, y: 244, count: 1, type: 'fossil' },
    { x: 167, y: 244, count: 1, type: 'fossil' },
    { x: 300, y: 244, count: 1, type: 'fossil' },
    { x: 387, y: 244, count: 1, type: 'fossil' },
    { x: 474, y: 244, count: 1, type: 'fossil' },
    { x: 610, y: 244, count: 1, type: 'fossil' },
    { x: 698, y: 244, count: 1, type: 'fossil' },
    // Fourth Row - 2 cells
    { x: 124, y: 332, count: 1, cellWidth: 62, cellHeight: 62, type: 'fossil' },
    { x: 654, y: 332, count: 1, cellWidth: 62, cellHeight: 62, type: 'fossil' }
  ],
  defaultCellSize: {
    width: 65,
    height: 65
  },
  defaultPadding: 0,
  itemOrderConfig: {
    fossil: [
      'jagged-fossil',
      'dense-fossil',
      'frigid-fossil',
      'aberrant-fossil',
      'scorched-fossil',
      'metallic-fossil',
      'pristine-fossil',
      'bound-fossil',
      'corroded-fossil',
      'opulent-fossil',
      'prismatic-fossil',
      'deft-fossil',
      'aetheric-fossil',
      'lucent-fossil',
      'serrated-fossil',
      'shuddering-fossil',
      'tangled-fossil',
      'bloodstained-fossil',
      'gilded-fossil',
      'fundamental-fossil',
      'sanctified-fossil',
      'hollow-fossil',
      'fractured-fossil',
      'glyphic-fossil',
      'faceted-fossil'
    ]
  }
};

/**
 * Grid configuration for oils-tab.png
 * Image dimensions: 843 x 842 pixels (from poeData layout)
 * Oils ordered by tier (itemOrderConfig); no MLE weights on poedata.dev for oils.
 */
export const OILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/oils-tab.png',
  imageDimensions: {
    width: 843,
    height: 842
  },
  cellGroups: [
    { x: 45, y: 40, count: 1, type: 'oil' },
    { x: 128, y: 40, count: 1, type: 'oil' },
    { x: 210, y: 40, count: 1, type: 'oil' },
    { x: 292, y: 40, count: 1, type: 'oil' },
    { x: 374, y: 40, count: 1, type: 'oil' },
    { x: 456, y: 40, count: 1, type: 'oil' },
    { x: 538, y: 40, count: 1, type: 'oil' },
    { x: 657, y: 40, count: 1, type: 'oil' },
    { x: 86, y: 115, count: 1, type: 'oil' },
    { x: 170, y: 115, count: 1, type: 'oil' },
    { x: 252, y: 115, count: 1, type: 'oil' },
    { x: 335, y: 115, count: 1, type: 'oil' },
    { x: 420, y: 115, count: 1, type: 'oil' },
    { x: 505, y: 115, count: 1, type: 'oil' },
    { x: 658, y: 115, count: 1, type: 'oil' },
    { x: 748, y: 115, count: 1, type: 'oil' },
    { x: 45, y: 500, count: 1, type: 'oil' },
    { x: 110, y: 500, count: 1, type: 'oil' },
    { x: 173, y: 500, count: 1, type: 'oil' },
    { x: 235, y: 500, count: 1, type: 'oil' },
    { x: 300, y: 500, count: 1, type: 'oil' },
    { x: 364, y: 500, count: 1, type: 'oil' },
    { x: 428, y: 500, count: 1, type: 'oil' },
    { x: 492, y: 500, count: 1, type: 'oil' },
    { x: 555, y: 500, count: 1, type: 'oil' },
    { x: 618, y: 500, count: 1, type: 'oil' },
    { x: 680, y: 500, count: 1, type: 'oil' },
    { x: 742, y: 500, count: 1, type: 'oil' },
    { x: 45, y: 565, count: 1, type: 'oil' },
    { x: 110, y: 565, count: 1, type: 'oil' },
    { x: 173, y: 565, count: 1, type: 'oil' },
    { x: 235, y: 565, count: 1, type: 'oil' },
    { x: 300, y: 565, count: 1, type: 'oil' },
    { x: 364, y: 565, count: 1, type: 'oil' },
    { x: 428, y: 565, count: 1, type: 'oil' },
    { x: 492, y: 565, count: 1, type: 'oil' },
    { x: 555, y: 565, count: 1, type: 'oil' },
    { x: 618, y: 565, count: 1, type: 'oil' },
    { x: 680, y: 565, count: 1, type: 'oil' },
    { x: 742, y: 565, count: 1, type: 'oil' },
    { x: 45, y: 630, count: 1, type: 'oil' },
    { x: 110, y: 630, count: 1, type: 'oil' },
    { x: 173, y: 630, count: 1, type: 'oil' },
    { x: 235, y: 630, count: 1, type: 'oil' },
    { x: 300, y: 630, count: 1, type: 'oil' },
    { x: 364, y: 630, count: 1, type: 'oil' },
    { x: 428, y: 630, count: 1, type: 'oil' },
    { x: 492, y: 630, count: 1, type: 'oil' },
    { x: 555, y: 630, count: 1, type: 'oil' },
    { x: 618, y: 630, count: 1, type: 'oil' },
    { x: 680, y: 630, count: 1, type: 'oil' },
    { x: 742, y: 630, count: 1, type: 'oil' },
    { x: 45, y: 690, count: 1, type: 'oil' },
    { x: 110, y: 690, count: 1, type: 'oil' },
    { x: 173, y: 690, count: 1, type: 'oil' },
    { x: 235, y: 690, count: 1, type: 'oil' },
    { x: 300, y: 690, count: 1, type: 'oil' },
    { x: 364, y: 690, count: 1, type: 'oil' },
    { x: 428, y: 690, count: 1, type: 'oil' },
    { x: 492, y: 690, count: 1, type: 'oil' },
    { x: 555, y: 690, count: 1, type: 'oil' },
    { x: 618, y: 690, count: 1, type: 'oil' },
    { x: 680, y: 690, count: 1, type: 'oil' },
    { x: 742, y: 690, count: 1, type: 'oil' },
    { x: 45, y: 755, count: 1, type: 'oil' },
    { x: 110, y: 755, count: 1, type: 'oil' },
    { x: 173, y: 755, count: 1, type: 'oil' },
    { x: 235, y: 755, count: 1, type: 'oil' },
    { x: 300, y: 755, count: 1, type: 'oil' },
    { x: 364, y: 755, count: 1, type: 'oil' },
    { x: 428, y: 755, count: 1, type: 'oil' },
    { x: 492, y: 755, count: 1, type: 'oil' },
    { x: 555, y: 755, count: 1, type: 'oil' },
    { x: 618, y: 755, count: 1, type: 'oil' },
    { x: 680, y: 755, count: 1, type: 'oil' },
    { x: 742, y: 755, count: 1, type: 'oil' }
  ],
  defaultCellSize: {
    width: 51,
    height: 51
  },
  defaultPadding: 2,
  itemOrderConfig: {
    oil: [
      'clear-oil',
      'sepia-oil',
      'amber-oil',
      'verdant-oil',
      'teal-oil',
      'azure-oil',
      'indigo-oil',
      'tainted-oil',
      'violet-oil',
      'crimson-oil',
      'black-oil',
      'opalescent-oil',
      'silver-oil',
      'golden-oil',
      'reflective-oil',
      'prismatic-oil'
    ]
  }
};

/**
 * Grid configuration for delirium-orbs-tab.png
 * Image dimensions: 839 x 841 pixels (from poeData layout)
 */
export const DELIRIUM_ORBS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/delirium-orbs-tab.png',
  imageDimensions: {
    width: 839,
    height: 841
  },
  cellGroups: [
    { x: 53, y: 40, count: 1, type: 'delirium-orb' },
    { x: 728, y: 40, count: 1, type: 'delirium-orb' },
    { x: 53, y: 128, count: 1, type: 'delirium-orb' },
    { x: 145, y: 128, count: 1, type: 'delirium-orb' },
    { x: 53, y: 220, count: 1, type: 'delirium-orb' },
    { x: 145, y: 220, count: 1, type: 'delirium-orb' },
    { x: 237, y: 220, count: 1, type: 'delirium-orb' },
    { x: 53, y: 312, count: 1, type: 'delirium-orb' },
    { x: 145, y: 312, count: 1, type: 'delirium-orb' },
    { x: 237, y: 312, count: 1, type: 'delirium-orb' },
    { x: 636, y: 130, count: 1, type: 'delirium-orb' },
    { x: 725, y: 130, count: 1, type: 'delirium-orb' },
    { x: 545, y: 220, count: 1, type: 'delirium-orb' },
    { x: 636, y: 220, count: 1, type: 'delirium-orb' },
    { x: 725, y: 220, count: 1, type: 'delirium-orb' },
    { x: 545, y: 313, count: 1, type: 'delirium-orb' },
    { x: 637, y: 313, count: 1, type: 'delirium-orb' },
    { x: 725, y: 313, count: 1, type: 'delirium-orb' },
    { x: 276, y: 62, count: 1, type: 'delirium-orb' },
    { x: 503, y: 62, count: 1, type: 'delirium-orb' },
    { x: 390, y: 130, count: 1, type: 'delirium-orb' },
    { x: 390, y: 220, count: 1, type: 'delirium-orb' },
    { x: 390, y: 313, count: 1, type: 'delirium-orb' },
    { x: 390, y: 410, count: 1, type: 'delirium-orb' },
    // Bottom storage grid 12×5
    { x: 51, y: 512, count: 12, cellWidth: 44, cellHeight: 44, padding: 17, type: 'delirium-orb' },
    { x: 51, y: 575, count: 12, cellWidth: 44, cellHeight: 44, padding: 17, type: 'delirium-orb' },
    { x: 51, y: 639, count: 12, cellWidth: 44, cellHeight: 44, padding: 17, type: 'delirium-orb' },
    { x: 51, y: 701, count: 12, cellWidth: 44, cellHeight: 44, padding: 17, type: 'delirium-orb' },
    { x: 51, y: 765, count: 12, cellWidth: 44, cellHeight: 44, padding: 17, type: 'delirium-orb' }
  ],
  defaultCellSize: {
    width: 61,
    height: 61
  },
  defaultPadding: 2,
  itemOrderConfig: {
    'delirium-orb': [
      'fine-delirium-orb',
      'primal-delirium-orb',
      'singular-delirium-orb',
      'cartographers-delirium-orb',
      'skittering-delirium-orb',
      'armoursmiths-delirium-orb',
      'thaumaturges-delirium-orb',
      'jewellers-delirium-orb',
      'foreboding-delirium-orb',
      'whispering-delirium-orb',
      'fossilised-delirium-orb',
      'timeless-delirium-orb',
      'blacksmiths-delirium-orb',
      'abyssal-delirium-orb',
      'obscured-delirium-orb',
      'fragmented-delirium-orb',
      'diviners-delirium-orb',
      'blighted-delirium-orb'
    ]
  }
};

/**
 * Grid configuration for Legion Emblems (fragments-tab.png, emblem row only)
 * Image dimensions: 842 x 792 pixels. Single row of 6 emblem cells.
 */
export const EMBLEMS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
  imageDimensions: {
    width: 842,
    height: 792
  },
  cellGroups: [
    { x: 230, y: 280, count: 1, type: 'emblem' },
    { x: 310, y: 280, count: 1, type: 'emblem' },
    { x: 390, y: 280, count: 1, type: 'emblem' },
    { x: 473, y: 280, count: 1, type: 'emblem' },
    { x: 553, y: 280, count: 1, type: 'emblem' },
    { x: 650, y: 280, count: 1, type: 'emblem' }
  ],
  defaultCellSize: {
    width: 60,
    height: 60
  },
  defaultPadding: 0,
  itemOrderConfig: {
    emblem: [
      'timeless-eternal-emblem',
      'timeless-karui-emblem',
      'timeless-vaal-emblem',
      'timeless-templar-emblem',
      'timeless-maraketh-emblem'
    ]
  }
};

export const CELL_GROUP_CONFIG = [
  // Row 1 (y=24)
  { x: 151, y: 24, count: 3, type: 'titanic' }, // Titanic
  { x: 333, y: 24, count: 2, type: 'sulphite' }, // Sulphite
  { x: 517, y: 24, count: 3, type: 'divination' }, // Divination
  
  // Row 2 (y=80)
  { x: 63, y: 80, count: 3, type: 'anarchy' }, // Anarchy
  { x: 246, y: 80, count: 3, type: 'ritual' }, // Ritual
  { x: 427, y: 80, count: 3, type: 'harvest' }, // Harvest
  { x: 608, y: 80, count: 3, type: 'kalguuran' }, // Kalguuran
  
  // Row 3 (y=139)
  { x: 309, y: 139, count: 4, type: 'influencing' }, // Influencing
  
  // Row 4 (y=167)
  { x: 63, y: 167, count: 3, type: 'bestiary' }, // Bestiary
  { x: 557, y: 167, count: 4, type: 'harbinger' }, // Harbinger
  
  // Row 5 (y=196)
  { x: 309, y: 196, count: 3, type: 'betrayal' }, // Betrayal
  
  // Row 6 (y=228)
  { x: 63, y: 228, count: 4, type: 'incursion' }, // Incursion
  { x: 557, y: 228, count: 4, type: 'domination' }, // Domination
  
  // Row 7 (y=254)
  { x: 309, y: 254, count: 3, type: 'torment' }, // Torment
  
  // Row 8 (y=310)
  { x: 126, y: 310, count: 4, cellWidth: 49, padding: 4, type: 'cartography' }, // Cartography
  { x: 436, y: 310, count: 4, cellWidth: 49, padding: 4, type: 'beyond' }, // Beyond
  
  // Row 9 (y=370)
  { x: 126, y: 370, count: 5, cellWidth: 49, padding: 4, type: 'ambush' }, // Ambush
  { x: 436, y: 370, count: 5, cellWidth: 49, padding: 4, type: 'ultimatum' }, // Ultimatum
  
  // Row 10 (y=429)
  { x: 126, y: 429, count: 4, cellWidth: 49, padding: 4, type: 'expedition' }, // Expedition
  { x: 436, y: 429, count: 5, cellWidth: 49, padding: 4, type: 'delirium' }, // Delirium
  
  // Row 11 (y=486)
  { x: 126, y: 486, count: 4, cellWidth: 49, padding: 4, type: 'legion' }, // Legion
  { x: 436, y: 486, count: 4, cellWidth: 49, padding: 4, type: 'blight' }, // Blight 
  
  // Row 12 (y=543)
  { x: 126, y: 543, count: 4, cellWidth: 49, padding: 4, type: 'abyss' }, // Abyss
  { x: 436, y: 543, count: 5, cellWidth: 49, padding: 4, type: 'essence' }, // Essence
  
  // Row 13 (y=604)
  { x: 255, y: 604, count: 5, cellWidth: 49, padding: 4, type: 'breach' }, // Breach
  
  // Row 14 (y=659)
  { x: 142, y: 661, count: 4, cellWidth: 50, padding: 5, type: 'misc' }, // Misc1
  { x: 435, y: 661, count: 5, cellWidth: 51, padding: 5, type: 'horned' }, // Horned1
  
  // Row 15 (y=718)
  { x: 142, y: 718, count: 4, cellWidth: 50, padding: 5, type: 'misc2' }, // Misc2
  { x: 520, y: 718, count: 2, cellWidth: 50, padding: 5, type: 'horned2' }, // Horned2
];

/**
 * Cell dimensions
 */
export const CELL_SIZE = {
  width: 49,
  height: 48,
};

/**
 * Padding between cells within a group
 */
export const CELL_PADDING = 2;

/**
 * Image dimensions
 */
export const IMAGE_DIMENSIONS = {
  width: 825,
  height: 787,
};

/**
 * Create individual cell definitions from group configuration
 * Supports per-group overrides for cell dimensions and padding
 * @returns {Array<CellDefinition>} Array of cell definitions
 */
export function createCellsFromGroups() {
  const cells = [];
  let cellId = 0;
  let globalRow = 0;
  let lastY = -1;
  
  CELL_GROUP_CONFIG.forEach((group, groupConfigIndex) => {
    // Determine row number based on Y position
    // If Y changed significantly, it's a new row
    if (lastY === -1 || Math.abs(group.y - lastY) > 10) {
      // New row detected
      if (lastY !== -1) {
        globalRow++;
      }
      lastY = group.y;
    }
    
    // Get cell dimensions and padding for this group (with fallback to defaults)
    const cellWidth = group.cellWidth ?? CELL_SIZE.width;
    const cellHeight = group.cellHeight ?? CELL_SIZE.height;
    const padding = group.padding ?? CELL_PADDING;
    
    // Create cells in this group
    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = group.x + i * (cellWidth + padding);
      
      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: group.y,
        width: cellWidth,
        height: cellHeight,
        row: globalRow,
        col: colInRow++,
        groupIndex: i, // Index within the group (0-based)
        groupType: group.type, // Type of scarab group (e.g., 'titanic', 'abyss')
        groupConfigIndex: groupConfigIndex, // Index of the group in CELL_GROUP_CONFIG
      });
    }
  });
  
  return cells;
}

/**
 * Get cell definitions (legacy function for compatibility)
 * @param {number} imageWidth - Image width (unused, kept for compatibility)
 * @param {number} imageHeight - Image height (unused, kept for compatibility)
 * @returns {Array<CellDefinition>}
 */
export function getCellDefinitions(imageWidth, imageHeight) {
  return createCellsFromGroups();
}

/**
 * Grid configuration for essence-tab.png
 * Image dimensions: 842 x 840 pixels (measured)
 * Essences are organized in rows; each row contains different tiers of the same essence type.
 * Left block: 12 rows (4×7 + 4×6 + 4×5 cells). Right block: 8 rows (4×4 + 4×3). Special: 4×1.
 */
export const ESSENCE_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/essence-tab.png',
  imageDimensions: {
    width: 842,
    height: 840
  },
  cellGroups: [
    // Left block - first 4 rows: 7 members each
    { x: 34, y: 29, count: 7, padding: 5, type: 'essence' },
    { x: 35, y: 94, count: 7, padding: 5, type: 'essence' },
    { x: 34, y: 159, count: 7, padding: 5, type: 'essence' },
    { x: 34, y: 225, count: 7, padding: 5, type: 'essence' },
    // Next 4 rows: 6 members each
    { x: 34, y: 290, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 358, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 423, count: 6, padding: 5, type: 'essence' },
    { x: 34, y: 489, count: 6, padding: 5, type: 'essence' },
    // Next 4 rows: 5 members each
    { x: 34, y: 553, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 619, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 685, count: 5, padding: 5, type: 'essence' },
    { x: 34, y: 755, count: 5, padding: 5, type: 'essence' },
    // Right block - 4 rows of 4, 4 rows of 3
    { x: 549, y: 29, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 94, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 159, count: 4, padding: 5, type: 'essence-right' },
    { x: 549, y: 225, count: 4, padding: 5, type: 'essence-right' },
    { x: 612, y: 291, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 358, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 423, count: 3, padding: 5, type: 'essence-right' },
    { x: 614, y: 489, count: 3, padding: 5, type: 'essence-right' },
    // Special essences: Insanity, Horror, Delirium, Hysteria
    { x: 745, y: 553, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 619, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 685, count: 1, padding: 0, type: 'essence-special' },
    { x: 745, y: 755, count: 1, padding: 0, type: 'essence-special' }
  ],
  defaultCellSize: {
    width: 61,
    height: 60
  },
  defaultPadding: 0,
  itemOrderConfig: {
    'essence': [],
    'essence-right': [],
    'essence-special': []
  }
};

/**
 * Create cell definitions from group configuration for a category grid config
 * @param {Object} gridConfig - Grid configuration with cellGroups, defaultCellSize, defaultPadding
 * @returns {Array<Object>} Array of cell definitions
 */
export function createCellsFromGroupsForCategory(gridConfig) {
  if (!gridConfig || !gridConfig.cellGroups) {
    return [];
  }

  const cells = [];
  let cellId = 0;
  let globalRow = 0;
  let lastY = -1;

  const defaultCellSize = gridConfig.defaultCellSize || CELL_SIZE;
  const defaultPadding = gridConfig.defaultPadding ?? CELL_PADDING;

  gridConfig.cellGroups.forEach((group, groupConfigIndex) => {
    if (lastY === -1 || Math.abs(group.y - lastY) > 10) {
      if (lastY !== -1) globalRow++;
      lastY = group.y;
    }

    const cellWidth = group.cellWidth ?? defaultCellSize.width;
    const cellHeight = group.cellHeight ?? defaultCellSize.height;
    const padding = group.padding ?? defaultPadding;

    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = group.x + i * (cellWidth + padding);
      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: group.y,
        width: cellWidth,
        height: cellHeight,
        row: globalRow,
        col: colInRow++,
        groupIndex: i,
        groupType: group.type,
        groupConfigIndex
      });
    }
  });

  return cells;
}

/**
 * Create a simple grid layout for testing (legacy function)
 * @param {number} cols - Number of columns
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} cellWidth - Cell width
 * @param {number} cellHeight - Cell height
 * @param {number} spacing - Spacing between cells
 * @param {number} maxCells - Maximum number of cells to create
 * @returns {Array<Array<{x: number, y: number, width: number, height: number}>>}
 */
export function createUniformGrid(cols = 6, startX = 10, startY = 10, cellWidth = 64, cellHeight = 64, spacing = 2, maxCells = 150) {
  const grid = [];
  let cellCount = 0;
  let currentY = startY;
  
  while (cellCount < maxCells) {
    const row = [];
    let currentX = startX;
    
    for (let col = 0; col < cols && cellCount < maxCells; col++) {
      row.push({
        x: currentX,
        y: currentY,
        width: cellWidth,
        height: cellHeight,
      });
      currentX += cellWidth + spacing;
      cellCount++;
    }
    
    if (row.length > 0) {
      grid.push(row);
    }
    currentY += cellHeight + spacing;
  }
  
  return grid;
}
