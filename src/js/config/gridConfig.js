/**
 * Grid configuration for stash tab visualization
 * Defines cell positions and layout for scarab and category grid views.
 * Scarab tab based on Scarab-tab.png image analysis (825 x 787 pixels).
 *
 * Cell group format: { x, y, count, cellWidth?, cellHeight?, padding?, type?, layout? }
 * - x, y: top-left corner of the group
 * - count: number of cells in that group
 * - cellWidth/cellHeight (optional): override default cell size for this group
 * - padding (optional): override default padding for this group
 * - type: group type (e.g. scarab type or item type)
 * - layout (optional): 'horizontal' (default) or 'vertical' — direction cells are laid out within the group
 */

// Base image dimensions (Scarab-tab.png)
export const IMAGE_DIMENSIONS = {
  width: 825,
  height: 787
};

// Default cell size (standard PoE stash cell size)
export const CELL_SIZE = {
  width: 49,
  height: 48
};

// Default padding between cells within a group
export const CELL_PADDING = 2;

/**
 * Explicit scarab ordering within groups
 * Maps group type to ordered array of scarab IDs (left to right, or top to bottom for vertical groups).
 * If a group type is not specified, scarabs are sorted by drop weight (low to high).
 */
export const SCARAB_ORDER_CONFIG = {
  'titanic': [
    'titanic-scarab',
    'titanic-scarab-of-treasures',
    'titanic-scarab-of-legend'
  ],
  'sulphite': [
    'sulphite-scarab',
    'sulphite-scarab-of-greed',
    'sulphite-scarab-of-fumes'
  ],
  'divination': [
    'divination-scarab-of-the-cloister',
    'divination-scarab-of-plenty',
    'divination-scarab-of-pilfering'
  ],
  'anarchy': [
    'anarchy-scarab',
    'anarchy-scarab-of-gigantification',
    'anarchy-scarab-of-partnership',
    'anarchy-scarab-of-the-exceptional'
  ],
  'ritual': [
    'ritual-scarab-of-selectiveness',
    'ritual-scarab-of-wisps',
    'ritual-scarab-of-abundance',
    'ritual-scarab-of-corpses'
  ],
  'harvest': [
    'harvest-scarab',
    'harvest-scarab-of-doubling',
    'harvest-scarab-of-cornucopia'
  ],
  'kalguuran': [
    'kalguuran-scarab',
    'kalguuran-scarab-of-guarded-riches',
    'kalguuran-scarab-of-refinement',
    'kalguuran-scarab-of-enriching'
  ],
  'influencing': [
    'influencing-scarab-of-the-shaper',
    'influencing-scarab-of-the-elder',
    'influencing-scarab-of-hordes',
    'influencing-scarab-of-interference'
  ],
  'bestiary': [
    'bestiary-scarab',
    'bestiary-scarab-of-the-herd',
    'bestiary-scarab-of-duplicating',
    'bestiary-scarab-of-shadowed-crow'
  ],
  'harbinger': [
    'harbinger-scarab',
    'harbinger-scarab-of-obelisks',
    'harbinger-scarab-of-regency',
    'harbinger-scarab-of-warhoards'
  ],
  'betrayal': [
    'betrayal-scarab',
    'betrayal-scarab-of-the-allflame',
    'betrayal-scarab-of-reinforcements',
    'betrayal-scarab-of-unbreaking'
  ],
  'incursion': [
    'incursion-scarab',
    'incursion-scarab-of-invasion',
    'incursion-scarab-of-champions',
    'incursion-scarab-of-timelines'
  ],
  'domination': [
    'domination-scarab',
    'domination-scarab-of-apparitions',
    'domination-scarab-of-evolution',
    'domination-scarab-of-terrors'
  ],
  'torment': [
    'torment-scarab',
    'torment-scarab-of-peculiarity',
    'torment-scarab-of-possession',
    'torment-scarab-of-release'
  ],
  'cartography': [
    'cartography-scarab-of-escalation',
    'cartography-scarab-of-risk',
    'cartography-scarab-of-the-multitude',
    'cartography-scarab-of-corruption',
    'cartography-scarab-of-singularity'
  ],
  'beyond': [
    'beyond-scarab',
    'beyond-scarab-of-haemophilia',
    'beyond-scarab-of-resurgence',
    'beyond-scarab-of-the-invasion',
    'beyond-scarab-of-corruption'
  ],
  'ambush': [
    'ambush-scarab',
    'ambush-scarab-of-hidden-compartments',
    'ambush-scarab-of-potency',
    'ambush-scarab-of-containment',
    'ambush-scarab-of-discernment'
  ],
  'ultimatum': [
    'ultimatum-scarab',
    'ultimatum-scarab-of-bribing',
    'ultimatum-scarab-of-dueling',
    'ultimatum-scarab-of-catalysing',
    'ultimatum-scarab-of-inscription'
  ],
  'expedition': [
    'expedition-scarab',
    'expedition-scarab-of-runefinding',
    'expedition-scarab-of-verisium-powder',
    'expedition-scarab-of-infusion',
    'expedition-scarab-of-archaeology'
  ],
  'delirium': [
    'delirium-scarab',
    'delirium-scarab-of-mania',
    'delirium-scarab-of-paranoia',
    'delirium-scarab-of-neuroses',
    'delirium-scarab-of-delusions'
  ],
  'legion': [
    'legion-scarab',
    'legion-scarab-of-officers',
    'legion-scarab-of-treasures',
    'legion-scarab-of-eternal-conflict',
    'legion-scarab-of-sekhema'
  ],
  'blight': [
    'blight-scarab',
    'blight-scarab-of-the-blightheart',
    'blight-scarab-of-blooming',
    'blight-scarab-of-invigoration'
  ],
  'abyss': [
    'abyss-scarab',
    'abyss-scarab-of-multitudes',
    'abyss-scarab-of-edifice',
    'abyss-scarab-of-descending',
    'abyss-scarab-of-profound-depth'
  ],
  'essence': [
    'essence-scarab',
    'essence-scarab-of-ascent',
    'essence-scarab-of-stability',
    'essence-scarab-of-calcification',
    'essence-scarab-of-adaptation'
  ],
  'misc': [
    'scarab-of-monstrous-lineage',
    'scarab-of-adversaries',
    'scarab-of-divinity',
    'scarab-of-the-dextral',
    'scarab-of-the-sinistral',
    'scarab-of-wisps',
    'scarab-of-radiant-storms',
    'scarab-of-stability'
  ],
  'breach': [
    'breach-scarab-of-the-hive',
    'breach-scarab-of-instability',
    'breach-scarab-of-the-marshal',
    'breach-scarab-of-the-incensed-swarm',
    'breach-scarab-of-resonant-cascade',
    'breach-scarab-of-the-dreamer'
  ],
  'horned': [
    'horned-scarab-of-bloodlines',
    'horned-scarab-of-nemeses',
    'horned-scarab-of-preservation',
    'horned-scarab-of-awakening',
    'horned-scarab-of-tradition',
    'horned-scarab-of-glittering',
    'horned-scarab-of-pandemonium'
  ]
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
 * Image dimensions: 843 x 842 pixels (measured). Top: 2 rows of 8 oils; bottom: 5×12 storage grid.
 */
export const OILS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/oils-tab.png',
  imageDimensions: { width: 843, height: 842 },
  cellGroups: [
    { x: 45, y: 40, count: 1, type: 'oil' }, { x: 128, y: 40, count: 1, type: 'oil' }, { x: 210, y: 40, count: 1, type: 'oil' }, { x: 292, y: 40, count: 1, type: 'oil' }, { x: 374, y: 40, count: 1, type: 'oil' }, { x: 456, y: 40, count: 1, type: 'oil' }, { x: 538, y: 40, count: 1, type: 'oil' }, { x: 657, y: 40, count: 1, type: 'oil' },
    { x: 86, y: 115, count: 1, type: 'oil' }, { x: 170, y: 115, count: 1, type: 'oil' }, { x: 252, y: 115, count: 1, type: 'oil' }, { x: 335, y: 115, count: 1, type: 'oil' }, { x: 420, y: 115, count: 1, type: 'oil' }, { x: 505, y: 115, count: 1, type: 'oil' }, { x: 658, y: 115, count: 1, type: 'oil' }, { x: 748, y: 115, count: 1, type: 'oil' },
    { x: 49, y: 500, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    { x: 49, y: 565, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    { x: 49, y: 630, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    { x: 49, y: 690, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 },
    { x: 49, y: 755, cellHeight: 46, cellWidth: 46, count: 12, padding: 17 }
  ],
  defaultCellSize: { width: 51, height: 51 },
  defaultPadding: 2,
  itemOrderConfig: {
    oil: [
      'clear-oil', 'sepia-oil', 'amber-oil', 'verdant-oil', 'teal-oil', 'azure-oil', 'indigo-oil', 'tainted-oil',
      'violet-oil', 'crimson-oil', 'black-oil', 'opalescent-oil', 'silver-oil', 'golden-oil', 'reflective-oil', 'prismatic-oil'
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
    { x: 51, y: 512, count: 12, cellWidth: 44, cellHeight: 44, padding: 17 },
    { x: 51, y: 575, count: 12, cellWidth: 44, cellHeight: 44, padding: 17 },
    { x: 51, y: 639, count: 12, cellWidth: 44, cellHeight: 44, padding: 17 },
    { x: 51, y: 701, count: 12, cellWidth: 44, cellHeight: 44, padding: 17 },
    { x: 51, y: 765, count: 12, cellWidth: 44, cellHeight: 44, padding: 17 }
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

/**
 * Grid configuration for breach-tab.png
 * Image dimensions: 840 x 794 pixels (measured)
 */
export const BREACH_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/breach-tab.png',
  imageDimensions: { width: 840, height: 794 },
  cellGroups: [
    { x: 207, y: 203, count: 1 },
    { x: 299, y: 203, count: 1 },
    { x: 390, y: 203, count: 1 },
    { x: 480, y: 203, count: 1 },
    { x: 571, y: 203, count: 1 },
    { x: 207, y: 295, count: 1, type: 'splinter' },
    { x: 299, y: 295, count: 1, type: 'splinter' },
    { x: 390, y: 295, count: 1, type: 'splinter' },
    { x: 480, y: 295, count: 1, type: 'splinter' },
    { x: 571, y: 295, count: 1, type: 'splinter' },
    { x: 207, y: 386, count: 1, type: 'breachstone' },
    { x: 299, y: 386, count: 1, type: 'breachstone' },
    { x: 390, y: 386, count: 1, type: 'breachstone' },
    { x: 480, y: 386, count: 1, type: 'breachstone' },
    { x: 571, y: 386, count: 1, type: 'breachstone' },
    { x: 207, y: 477, count: 1 },
    { x: 299, y: 477, count: 1 },
    { x: 390, y: 477, count: 1 },
    { x: 480, y: 477, count: 1 },
    { x: 571, y: 477, count: 1 }
  ],
  defaultCellSize: { width: 60, height: 60 },
  defaultPadding: 0,
  itemOrderConfig: {
    splinter: ['splinter-of-xoph', 'splinter-of-tul', 'splinter-of-esh', 'splinter-of-uul-netol', 'splinter-of-chayula'],
    breachstone: ['xoph-s-breachstone', 'tul-s-breachstone', 'esh-s-breachstone', 'uul-netol-s-breachstone', 'chayula-s-breachstone']
  }
};

/**
 * Grid configuration for fragments-tab.png (legion splinters, emblems, etc.)
 * Image dimensions: 842 x 792 pixels (measured)
 */
export const FRAGMENTS_GRID_CONFIG = {
  tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
  imageDimensions: { width: 842, height: 792 },
  cellGroups: [
    { x: 98, y: 39, count: 1 }, 
    { x: 175, y: 39, count: 1 }, 
    { x: 262, y: 39, count: 1 }, 
    { x: 345, y: 39, count: 1 }, 
    { x: 432, y: 39, count: 1 }, 
    { x: 513, y: 39, count: 1 }, 
    { x: 603, y: 39, count: 1 }, 
    { x: 680, y: 39, count: 1 },
    { x: 98, y: 118, count: 1 }, 
    { x: 175, y: 118, count: 1 },
    { x: 262, y: 118, count: 1 }, 
    { x: 345, y: 118, count: 1 }, 
    { x: 432, y: 118, count: 1 }, 
    { x: 515, y: 118, count: 1 }, 
    { x: 603, y: 118, count: 1 }, 
    { x: 680, y: 118, count: 1 },
    { x: 130, y: 202, count: 1 }, 
    { x: 230, y: 202, count: 1, type: 'splinter' }, 
    { x: 310, y: 202, count: 1, type: 'splinter' }, 
    { x: 390, y: 202, count: 1, type: 'splinter' }, 
    { x: 473, y: 202, count: 1, type: 'splinter' }, 
    { x: 553, y: 202, count: 1, type: 'splinter' }, 
    { x: 650, y: 202, count: 1 },
    { x: 130, y: 280, count: 1 }, 
    { x: 230, y: 280, count: 1, type: 'emblem' }, 
    { x: 310, y: 280, count: 1, type: 'emblem' }, 
    { x: 390, y: 280, count: 1, type: 'emblem' }, 
    { x: 473, y: 280, count: 1, type: 'emblem' }, 
    { x: 553, y: 280, count: 1, type: 'emblem' }, 
    { x: 650, y: 280, count: 1 },
    { x: 130, y: 360, count: 1 }, 
    { x: 230, y: 360, count: 1 }, 
    { x: 310, y: 360, count: 1 }, 
    { x: 390, y: 360, count: 1 }, 
    { x: 473, y: 360, count: 1 }, 
    { x: 553, y: 360, count: 1 },
    { x: 130, y: 447, count: 1 }, 
    { x: 285, y: 447, count: 1 }, 
    { x: 390, y: 447, count: 1 }, 
    { x: 495, y: 447, count: 1 }, 
    { x: 650, y: 447, count: 1 },
    { x: 130, y: 530, count: 1 }, 
    { x: 215, y: 530, count: 1 }, 
    { x: 350, y: 530, count: 1 }, 
    { x: 430, y: 530, count: 1 }, 
    { x: 570, y: 530, count: 1 }, 
    { x: 650, y: 530, count: 1 },
    { x: 130, y: 612, count: 1 }, 
    { x: 215, y: 612, count: 1 }, 
    { x: 350, y: 612, count: 1 }, 
    { x: 430, y: 612, count: 1 }, 
    { x: 570, y: 612, count: 1 }, 
    { x: 650, y: 612, count: 1 },
    { x: 22, y: 700, count: 1 }, 
    { x: 105, y: 700, count: 1 }, 
    { x: 185, y: 700, count: 1 }, 
    { x: 265, y: 700, count: 1 }, 
    { x: 350, y: 700, count: 1 }, 
    { x: 430, y: 700, count: 1 }, 
    { x: 515, y: 700, count: 1 }, 
    { x: 595, y: 700, count: 1 }, 
    { x: 675, y: 700, count: 1 }, 
    { x: 755, y: 700, count: 1 }
  ],
  defaultCellSize: { width: 60, height: 60 },
  defaultPadding: 0,
  itemOrderConfig: { splinter: [], emblem: [] }
};

/**
 * Scarab cell group configuration (Scarab-tab.png layout).
 * Supports layout: 'horizontal' (default) or 'vertical' for columns.
 */
export const CELL_GROUP_CONFIG = [
  // Row 1 (y=24)
  { x: 52, y: 20, count: 5, cellWidth: 49, padding: 4, type: 'cartography' },
  { x: 373, y: 20, count: 4, type: 'influencing' },

  { x: 52, y: 80, count: 3, type: 'divination' },
  { x: 373, y: 80, count: 3, type: 'titanic' },

  { x: 52, y: 147, count: 4, type: 'bestiary' },
  { x: 373, y: 147, count: 5, cellWidth: 49, padding: 4, type: 'abyss' },

  { x: 52, y: 210, count: 4, type: 'betrayal' },
  { x: 373, y: 210, count: 4, cellWidth: 49, padding: 4, type: 'blight' },

  { x: 53, y: 270, count: 4, type: 'incursion' },
  { x: 373, y: 270, count: 6, cellWidth: 49, padding: 4, type: 'breach' },

  { x: 53, y: 336, count: 3, type: 'sulphite' },
  { x: 373, y: 336, count: 5, cellWidth: 49, padding: 4, type: 'delirium' },

  { x: 53, y: 398, count: 5, cellWidth: 49, padding: 4, type: 'ambush' },
  { x: 373, y: 398, count: 5, cellWidth: 49, padding: 4, type: 'expedition' },

  { x: 53, y: 460, count: 4, type: 'anarchy' },
  { x: 373, y: 460, count: 3, type: 'harvest' },

  { x: 53, y: 523, count: 5, cellWidth: 49, padding: 4, type: 'beyond' },
  { x: 373, y: 523, count: 4, type: 'kalguuran' },

  { x: 53, y: 583, count: 4, type: 'domination' },
  { x: 373, y: 583, count: 5, cellWidth: 49, padding: 4, type: 'legion' },

  { x: 53, y: 646, count: 5, cellWidth: 49, padding: 4, type: 'essence' },
  { x: 373, y: 646, count: 4, type: 'ritual' },

  { x: 53, y: 709, count: 4, type: 'torment' },
  { x: 373, y: 709, count: 5, cellWidth: 49, padding: 4, type: 'ultimatum' },

  // Vertical groups (misc and horned columns)
  { x: 695, y: 178, count: 8, cellWidth: 50, padding: 5, type: 'misc', layout: 'vertical' },
  { x: 755, y: 203, count: 7, cellWidth: 51, padding: 5, type: 'horned', layout: 'vertical' }
];

/**
 * Create cell definitions from scarab group configuration.
 * Supports horizontal and vertical layout; per-group overrides for dimensions and padding.
 * @returns {Array<Object>} Array of cell definitions
 */
export function createCellsFromGroups() {
  const cells = [];
  let cellId = 0;
  let globalRow = 0;
  let lastY = -1;

  CELL_GROUP_CONFIG.forEach((group, groupConfigIndex) => {
    const layout = group.layout ?? 'horizontal';

    if (lastY === -1 || Math.abs(group.y - lastY) > 10) {
      if (lastY !== -1) globalRow++;
      lastY = group.y;
    }

    const cellWidth = group.cellWidth ?? CELL_SIZE.width;
    const cellHeight = group.cellHeight ?? CELL_SIZE.height;
    const padding = group.padding ?? CELL_PADDING;
    const orderForType = SCARAB_ORDER_CONFIG[group.type];

    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = layout === 'vertical'
        ? group.x
        : group.x + i * (cellWidth + padding);
      const cellY = layout === 'vertical'
        ? group.y + i * (cellHeight + padding)
        : group.y;
      const cellRow = layout === 'vertical' ? globalRow + i : globalRow;
      const cellCol = layout === 'vertical' ? 0 : colInRow++;
      const scarabId = orderForType && orderForType[i] ? orderForType[i] : null;

      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        row: cellRow,
        col: cellCol,
        groupIndex: i,
        groupType: group.type,
        groupConfigIndex: groupConfigIndex,
        scarabId
      });
    }

    if (layout === 'vertical') {
      lastY = group.y + (group.count - 1) * (cellHeight + padding) + cellHeight;
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
 * Create cell definitions from group configuration for a category grid config.
 * Supports horizontal and vertical layout; optional expectedItemId from itemOrderConfig.
 * @param {Object} gridConfig - Grid configuration with cellGroups, defaultCellSize, defaultPadding, itemOrderConfig
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
  const orderConfig = gridConfig.itemOrderConfig || {};

  gridConfig.cellGroups.forEach((group, groupConfigIndex) => {
    const layout = group.layout ?? 'horizontal';

    if (lastY === -1 || Math.abs(group.y - lastY) > 10) {
      if (lastY !== -1) globalRow++;
      lastY = group.y;
    }

    const cellWidth = group.cellWidth ?? defaultCellSize.width;
    const cellHeight = group.cellHeight ?? defaultCellSize.height;
    const padding = group.padding ?? defaultPadding;
    const orderForType = orderConfig[group.type];
    const useOrderForIcon = group.expectIconFromOrder !== false;

    let colInRow = 0;
    for (let i = 0; i < group.count; i++) {
      const cellX = layout === 'vertical'
        ? group.x
        : group.x + i * (cellWidth + padding);
      const cellY = layout === 'vertical'
        ? group.y + i * (cellHeight + padding)
        : group.y;
      const cellRow = layout === 'vertical' ? globalRow + i : globalRow;
      const cellCol = layout === 'vertical' ? 0 : colInRow++;
      const expectedItemId = useOrderForIcon && orderForType && orderForType[i] ? orderForType[i] : null;

      cells.push({
        id: `cell-${cellId++}`,
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        row: cellRow,
        col: cellCol,
        groupIndex: i,
        groupType: group.type,
        groupConfigIndex: groupConfigIndex,
        expectedItemId
      });
    }

    if (layout === 'vertical') {
      lastY = group.y + (group.count - 1) * (cellHeight + padding) + cellHeight;
    }
  });

  return cells;
}

/**
 * Category-to-tab image and grid config mapping
 */
export const CATEGORY_GRID_MAPPING = {
  'breach': {
    tabImagePath: '/assets/images/stashTabs/breach-tab.png',
    gridConfigKey: 'breach',
    imageDirectory: '/assets/images/breach/'
  },
  'legion': {
    tabImagePath: '/assets/images/stashTabs/fragments-tab.png',
    gridConfigKey: 'fragments',
    imageDirectory: '/assets/images/legion/'
  },
  'delirium-orbs': {
    tabImagePath: '/assets/images/stashTabs/delirium-orbs-tab.png',
    gridConfigKey: 'delirium-orbs',
    imageDirectory: '/assets/images/deliriumOrbs/'
  },
  'essences': {
    tabImagePath: '/assets/images/stashTabs/essence-tab.png',
    gridConfigKey: 'essence',
    imageDirectory: '/assets/images/essences/'
  },
  'fossils': {
    tabImagePath: '/assets/images/stashTabs/fossils-tab.png',
    gridConfigKey: 'fossils',
    imageDirectory: '/assets/images/fossils/'
  },
  'oils': {
    tabImagePath: '/assets/images/stashTabs/oils-tab.png',
    gridConfigKey: 'oils',
    imageDirectory: '/assets/images/oils/'
  },
  'catalysts': {
    tabImagePath: '/assets/images/stashTabs/catalysts-tab.png',
    gridConfigKey: 'catalysts',
    imageDirectory: '/assets/images/catalysts/'
  },
  'scarabs': {
    tabImagePath: '/assets/images/stashTabs/scarab-tab.png',
    gridConfigKey: 'scarab',
    imageDirectory: '/assets/images/scarabs/'
  }
};

export function getCategoryTabImage(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.tabImagePath : null;
}

export function getCategoryImageDirectory(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.imageDirectory : null;
}

export function getGridConfigKey(categoryId) {
  const mapping = CATEGORY_GRID_MAPPING[categoryId];
  return mapping ? mapping.gridConfigKey : null;
}

const GRID_CONFIGS = {
  'breach': BREACH_GRID_CONFIG,
  'fragments': FRAGMENTS_GRID_CONFIG,
  'delirium-orbs': DELIRIUM_ORBS_GRID_CONFIG,
  'essence': ESSENCE_GRID_CONFIG,
  'fossils': FOSSILS_GRID_CONFIG,
  'oils': OILS_GRID_CONFIG,
  'catalysts': CATALYSTS_GRID_CONFIG
};

export function getGridConfig(categoryId) {
  const configKey = getGridConfigKey(categoryId);
  if (!configKey || configKey === 'scarab') return null;
  return GRID_CONFIGS[configKey] || null;
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
