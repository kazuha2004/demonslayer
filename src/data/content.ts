export type PublicAssetPath = `/${string}`;

export interface Character {
  id: string;
  name: string;
  surname: string;
  kanji: string;
  breathing: string;
  weapon: string;
  rank: string;
  accentColor: string;
  motePalette: string[];
  pattern: string;
  bio: string;
  image: PublicAssetPath;
  depthImage: PublicAssetPath;
}

export interface Demon {
  id: string;
  name: string;
  surname: string;
  title: string;
  kanji: string;
  rank: string;
  art: string;
  weakness: string;
  bio: string;
  accentColor: string;
  motePalette: string[];
  image: PublicAssetPath;
  depthImage: PublicAssetPath;
  faceX: number;
  faceY: number;
  zoom: number;
}

export interface Blade {
  id: string;
  label: string;
  breathing: string;
  users: string[];
  accentColor: string;
  image: PublicAssetPath;
  glow: number;
  filter: string;
  kanji: string;
  phrase: string;
  description: string;
  properties: { label: string; value: string; icon: "drop" | "swirl" | "star" }[];
  callouts: {
    id: "tsuka" | "tsuba" | "blade";
    label: string;
    value: string;
    x: number;
    y: number;
    side: "left" | "right";
  }[];
}

export const characters: Character[] = [
  {
    id: "tanjiro",
    name: "Tanjiro",
    surname: "Kamado",
    kanji: "竈門炭治郎",
    breathing: "Water",
    weapon: "Nichirin Blade",
    rank: "Kinoto",
    accentColor: "#1e6fd9",
    motePalette: ["#8eeeff", "#d9faff", "#b8f5e8"],
    pattern: "seigaiha",
    bio: "A kind-hearted swordsman determined to protect others and find a way to help his sister.",
    image: "/characters/tanjiro.png",
    depthImage: "/characters/tanjiro-depth.png",
  },
  {
    id: "zenitsu",
    name: "Zenitsu",
    surname: "Agatsuma",
    kanji: "我妻善逸",
    breathing: "Thunder Breathing",
    weapon: "Nichirin katana",
    rank: "Kinoe",
    accentColor: "#f4c20d",
    motePalette: ["#ffe36e", "#fffbe1", "#f7bd33"],
    pattern: "triangles",
    bio: "A nervous but devoted swordsman whose courage emerges when it matters most.",
    image: "/characters/zenitsu.png",
    depthImage: "/characters/zenitsu-depth.png",
  },
  {
    id: "inosuke",
    name: "Inosuke",
    surname: "Hashibira",
    kanji: "嘴平伊之助",
    breathing: "Beast Breathing",
    weapon: "Paired serrated Nichirin swords",
    rank: "Kinoe",
    accentColor: "#5b7c99",
    motePalette: ["#a9c5d8", "#f0f3f5", "#839bad"],
    pattern: "claws",
    bio: "A fiercely competitive fighter who relies on instinct and unconventional techniques.",
    image: "/characters/inosuke.png",
    depthImage: "/characters/inosuke-depth.png",
  },
  {
    id: "shinobu",
    name: "Shinobu",
    surname: "Kocho",
    kanji: "胡蝶しのぶ",
    breathing: "Insect Breathing",
    weapon: "Poison-tipped Nichirin sword",
    rank: "Hashira",
    accentColor: "#9b5de5",
    motePalette: ["#d9b4ff", "#f2e4ff", "#a976e8"],
    pattern: "butterflies",
    bio: "A poised swordswoman who uses precise movement and specialized wisteria poison.",
    image: "/characters/shinobu.png",
    depthImage: "/characters/shinobu-depth.png",
  },
  {
    id: "giyu",
    name: "Giyu",
    surname: "Tomioka",
    kanji: "冨岡義勇",
    breathing: "Water Breathing",
    weapon: "Nichirin katana",
    rank: "Hashira",
    accentColor: "#1b8a9a",
    motePalette: ["#70d6d1", "#d9fffa", "#87cfc8"],
    pattern: "seigaiha",
    bio: "A reserved swordsman whose steady resolve guides his actions.",
    image: "/characters/giyu.png",
    depthImage: "/characters/giyu-depth.png",
  },
];

export const demons: Demon[] = [
  {
    id: "muzan",
    name: "Muzan",
    surname: "Kibutsuji",
    title: "King of the Demons",
    kanji: "鬼舞辻無惨",
    rank: "Origin",
    art: "Blood Manipulation",
    weakness: "Sunlight",
    bio: "The progenitor of demons, Muzan hides in plain sight while pursuing a way to conquer the sun.",
    accentColor: "#c1121f",
    motePalette: ["#7f101b", "#d83335", "#ff9a67"],
    image: "/demons/muzan.png",
    depthImage: "/demons/muzan-depth.png",
    faceX: 55,
    faceY: 12,
    zoom: 2.5,
  },
  {
    id: "kokushibo",
    name: "Kokushibo",
    surname: "",
    title: "Upper Moon One",
    kanji: "黒死牟",
    rank: "Upper Moon 壱",
    art: "Moon Breathing",
    weakness: "Sunlight",
    bio: "A composed and formidable swordsman whose many eyes witness every movement in battle.",
    accentColor: "#7a1fa2",
    motePalette: ["#6a245f", "#a34a58", "#f2c0d0"],
    image: "/demons/kokushiboo.png",
    depthImage: "/demons/kokushiboo-depth.png",
    faceX: 52,
    faceY: 12,
    zoom: 2.7,
  },
  {
    id: "doma",
    name: "Doma",
    surname: "",
    title: "Upper Moon Two",
    kanji: "童磨",
    rank: "Upper Moon 弐",
    art: "Cryokinesis",
    weakness: "Sunlight",
    bio: "A charming and unsettling figure, Doma turns the air around him into a field of bitter cold.",
    accentColor: "#e8a0c8",
    motePalette: ["#f2a6ca", "#ffe6ef", "#d88cab"],
    image: "/demons/doma.png",
    depthImage: "/demons/doma-depth.png",
    faceX: 53,
    faceY: 12,
    zoom: 2.55,
  },
  {
    id: "akaza",
    name: "Akaza",
    surname: "",
    title: "Upper Moon Three",
    kanji: "猗窩座",
    rank: "Upper Moon 参",
    art: "Destructive Death",
    weakness: "Sunlight",
    bio: "A relentless close-range fighter who measures strength through resolve and skill in combat.",
    accentColor: "#3b6fd4",
    motePalette: ["#52b7e7", "#dff7ff", "#f18a87"],
    image: "/demons/akaza.png",
    depthImage: "/demons/akaza-depth.png",
    faceX: 53,
    faceY: 15,
    zoom: 2.6,
  },
  {
    id: "rui",
    name: "Rui",
    surname: "",
    title: "Lower Moon Five",
    kanji: "累",
    rank: "Lower Moon 伍",
    art: "Blood Demon Art: Threads",
    weakness: "Sunlight",
    bio: "A quiet figure who spins nearly invisible threads and guards the family he has created.",
    accentColor: "#d8d8e8",
    motePalette: ["#edf2f5", "#ffffff", "#d7dde2"],
    image: "/demons/rui.png",
    depthImage: "/demons/rui-depth.png",
    faceX: 54,
    faceY: 13,
    zoom: 2.65,
  },
];

export const demonShowcaseTheme = {
  ghostColor: "#8a5a50",
  ghostOpacity: 0.3,
  petalsDesktop: 14,
  petalsMobile: 8,
  gridOpacity: 0.03,
  checkerColor: "#a51d27",
  backgroundScrimOpacity: 0.35,
  glitchOffset: 6,
  glitchDuration: 300,
};

export const blades: Blade[] = [
  {
    id: "water",
    label: "Water",
    breathing: "Water Breathing",
    users: ["Tanjiro", "Giyu"],
    accentColor: "#2f80ed",
    glow: 0.44,
    filter: "saturate(1.05) contrast(1.03)",
    image: "/blades/water.png",
    kanji: "水の呼吸",
    phrase: "Flow with the current.",
    description: "A measured rhythm becomes unstoppable force. Water forms adapt to the moment, turning each movement into a seamless flow.",
    properties: [
      { label: "Sunlight", value: "Absorbs sunlight", icon: "drop" },
      { label: "Color", value: "Changes color", icon: "star" },
      { label: "Resonance", value: "Resonates with Breathing", icon: "swirl" },
    ],
    callouts: [
      { id: "tsuka", label: "Tsuka (Handle)", value: "Woven ray skin", x: 82, y: 20, side: "left" },
      { id: "tsuba", label: "Tsuba (Guard)", value: "Wave-cut iron", x: 71, y: 32, side: "left" },
      { id: "blade", label: "Blade (Nichirin)", value: "Water-blue steel", x: 35, y: 68, side: "right" },
    ],
  },
  {
    id: "thunder",
    label: "Thunder",
    breathing: "Thunder Breathing",
    users: ["Zenitsu"],
    accentColor: "#f4c20d",
    glow: 0.55,
    filter: "saturate(1.12) contrast(1.06)",
    image: "/blades/thunder.png",
    kanji: "雷の呼吸",
    phrase: "Become the flash.",
    description: "Power gathers in a single instant. Thunder forms release it in a sudden, blinding burst of speed and precision.",
    properties: [
      { label: "Sunlight", value: "Absorbs sunlight", icon: "drop" },
      { label: "Color", value: "Changes color", icon: "star" },
      { label: "Resonance", value: "Resonates with Breathing", icon: "swirl" },
    ],
    callouts: [
      { id: "tsuka", label: "Tsuka (Handle)", value: "White diamond wrap", x: 84, y: 18, side: "left" },
      { id: "tsuba", label: "Tsuba (Guard)", value: "Sunburst iron", x: 71, y: 31, side: "left" },
      { id: "blade", label: "Blade (Nichirin)", value: "Flash-gold edge", x: 36, y: 66, side: "right" },
    ],
  },
  {
    id: "beast",
    label: "Beast",
    breathing: "Beast Breathing",
    users: ["Inosuke"],
    accentColor: "#6b8fa8",
    glow: 0.27,
    filter: "saturate(.72) contrast(1.12)",
    image: "/blades/beast.png",
    kanji: "獣の呼吸",
    phrase: "Trust the instinct.",
    description: "Unorthodox and untamed, this steel favors raw instinct. Its twin serrated edges answer with a wild, unpredictable rhythm.",
    properties: [
      { label: "Sunlight", value: "Absorbs sunlight", icon: "drop" },
      { label: "Color", value: "Changes color", icon: "star" },
      { label: "Resonance", value: "Resonates with Breathing", icon: "swirl" },
    ],
    callouts: [
      { id: "tsuka", label: "Tsuka (Handle)", value: "Rough-grip wrap", x: 82, y: 19, side: "left" },
      { id: "tsuba", label: "Tsuba (Guard)", value: "Worn iron guard", x: 70, y: 33, side: "left" },
      { id: "blade", label: "Blade (Nichirin)", value: "Notched steel", x: 35, y: 67, side: "right" },
    ],
  },
  {
    id: "butterfly",
    label: "Butterfly",
    breathing: "Insect Breathing",
    users: ["Shinobu"],
    accentColor: "#9b5de5",
    glow: 0.48,
    filter: "saturate(1.12) contrast(1.02)",
    image: "/blades/butterfly.png",
    kanji: "蟲の呼吸",
    phrase: "A quiet, precise strike.",
    description: "Light and exceptionally agile, this blade is made for piercing precision. Delicate details conceal the potency of wisteria.",
    properties: [
      { label: "Sunlight", value: "Absorbs sunlight", icon: "drop" },
      { label: "Color", value: "Changes color", icon: "star" },
      { label: "Resonance", value: "Resonates with Breathing", icon: "swirl" },
    ],
    callouts: [
      { id: "tsuka", label: "Tsuka (Handle)", value: "Lilac diamond wrap", x: 84, y: 20, side: "left" },
      { id: "tsuba", label: "Tsuba (Guard)", value: "Wisteria butterfly", x: 71, y: 32, side: "left" },
      { id: "blade", label: "Blade (Nichirin)", value: "Piercing steel", x: 31, y: 68, side: "right" },
    ],
  },
];

export const giyuEnabled = false;
export const giyuBlade: Blade = {
  id: "giyu",
  label: "Tomioka",
  breathing: "Water Breathing",
  users: ["Giyu"],
  accentColor: "#267f9e",
  glow: 0.38,
  filter: "saturate(1.2) hue-rotate(-15deg) brightness(.9)",
  image: "/blades/water.png",
  kanji: "水の呼吸",
  phrase: "Stillness beneath the tide.",
  description: "A quiet variation on Water Breathing: a composed presence, an even rhythm, and a blade that never strays from its purpose.",
  properties: [
    { label: "Sunlight", value: "Absorbs sunlight", icon: "drop" },
    { label: "Color", value: "Changes color", icon: "star" },
    { label: "Resonance", value: "Resonates with Breathing", icon: "swirl" },
  ],
  callouts: [
    { id: "tsuka", label: "Tsuka (Handle)", value: "Black woven wrap", x: 82, y: 20, side: "left" },
    { id: "tsuba", label: "Tsuba (Guard)", value: "Wave-cut iron", x: 70, y: 31, side: "left" },
    { id: "blade", label: "Blade (Nichirin)", value: "Deep-water steel", x: 37, y: 66, side: "right" },
  ],
};

export const bladeSectionCopy = {
  sectionNumber: "03",
  sectionLabel: "Nichirin Blade",
  titleFirst: "Nichirin",
  titleSecond: "Blade",
  subtitle: "THE BLADE OF A DEMON SLAYER",
  description: "A legendary blade, forged with unwavering resolve, capable of breathing techniques.",
  breathingLabel: "Breathing style",
  usersLabel: "Used by",
  propertiesTitle: "Unique properties",
  rightTitle: "日輪刃",
  rightPhrase: "それは、呼吸と共に在る刃",
  leftSeal: "滅",
  rightSeal: "呼吸",
  scroll: "Scroll to Explore",
};
