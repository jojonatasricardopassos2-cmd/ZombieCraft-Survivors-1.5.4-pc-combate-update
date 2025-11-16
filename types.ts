export enum GameState {
  MENU,
  PLAYING,
  SHOP,
  INVENTORY,
  PAUSED,
  GAME_OVER,
  CREATIVE_INVENTORY,
  WORKBENCH,
  PORTAL_UI,
  CHEST_UI,
  FURNACE,
  QUEST_UI,
  VENDOR_SHOP,
  NAMING_PET,
  ENCHANTING,
}

export enum Language {
    EN = 'EN',
    PT = 'PT',
}

export enum Biome {
  PLAINS = 'PLAINS',
  FOREST = 'FOREST',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  LAVA = 'LAVA',
  WATER = 'WATER',
  RUBY = 'RUBY',
}

export enum ResourceType {
  WOOD = 'WOOD',
  STONE = 'STONE',
  COAL = 'COAL',
  IRON = 'IRON',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
  RUBY = 'RUBY',
  RUBY_CRYSTAL = 'RUBY_CRYSTAL',
}

export enum ToolTier {
  HAND = 0,
  WOOD = 1,
  STONE = 2,
  IRON = 3,
  GOLD = 4,
  DIAMOND = 5,
  RUBY = 6,
}

export enum Enchantment {
    EFFICIENCY = 'EFFICIENCY',
    SHARPNESS = 'SHARPNESS',
    PROTECTION = 'PROTECTION',
    HOMING = 'HOMING',
    THORNS = 'THORNS',
    MENDING = 'MENDING',
    LOOTING = 'LOOTING',
    UNBREAKING = 'UNBREAKING',
}

export interface ItemEnchantment {
    type: Enchantment;
    level: number;
}

export interface Item {
  id: string;
  name: string;
  name_pt: string;
  type: 'resource' | 'tool' | 'weapon' | 'armor' | 'block' | 'consumable' | 'crafting_material' | 'ammo' | 'shield' | 'light_source' | 'fuel' | 'smeltable' | 'totem' | 'currency';
  quantity: number;
  stackable: boolean;
  maxStack: number;
  durability?: number;
  maxDurability?: number;
  smeltResult?: string;
  fuelTime?: number;
  enchantments?: ItemEnchantment[];
}

export interface Tool extends Item {
  tier: ToolTier;
  toolType: 'pickaxe' | 'axe' | 'sword' | 'pistol' | 'rifle' | 'ak47' | 'bow' | 'bazooka';
  damage?: number;
  collectSpeed?: number;
  shotsPerBurst?: number;
}

export interface Armor extends Item {
    defense: number;
    material: 'iron' | 'gold' | 'diamond' | 'ruby';
}

export interface Consumable extends Item {
    heals?: number;
    stamina?: number;
}

export interface InventorySlot {
  item: Item | null;
}

export interface Quest {
    id: string;
    type: 'collect';
    itemId: string;
    requiredAmount: number;
    rewardMin: number;
    rewardMax: number;
    description_en: string;
    description_pt: string;
}

export interface Player {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  money: number;
  ammo: number;
  inventory: InventorySlot[];
  craftingGrid: InventorySlot[];
  craftingOutput: InventorySlot;
  enchantingSlots: InventorySlot[]; // 0: item, 1: crystal
  activeSlot: number; // For hotbar: 0-4
  weapon: Tool | null;
  armor: Armor | null;
  tool: Tool | null;
  offHand: InventorySlot;
  speed: number;
  sprinting: boolean;
  lastAttackTime: number;
  lavaDamageTimer: number;
  lastDamageTime: number;
  lastEnergyDamageTime: number;
  dimension: 'OVERWORLD' | 'RUBY';
  overworldX: number;
  overworldY: number;
  slowEffect?: { endTime: number; factor: number; };
  activeQuest: Quest | null;
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface ResourceNode extends GameObject {
  type: ResourceType;
  hp: number;
  maxHp: number;
  respawnTimer: number;
}

export enum ZombieType {
    NORMAL,
    GIANT,
    IMMORTAL,
    BOSS,
    RUBY,
    DESERT,
    SNOW,
    FOREST,
    LAVA,
}

export enum ZombieState {
    WANDERING,
    PURSUING,
    INVESTIGATING,
    ATTACKING,
}

export interface Zombie extends GameObject {
  type: ZombieType;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  targetId: number | null;
  isBoss: boolean;
  attackCooldown: number;
  lastAttackTime: number;
  shieldActive?: boolean;
  state: ZombieState;
  targetX: number;
  targetY: number;
  stateTimer: number; // Used for various state-based timings
}

export enum AnimalType {
    PIG,
    COW,
    CHICKEN,
    SHEEP,
}

export interface Animal extends GameObject {
    type: AnimalType;
    hp: number;
    speed: number;
    vx: number; // velocity x
    vy: number; // velocity y
    changeDirectionTimer: number;
}

export enum DogState {
    WILD,
    TAMING,
    FOLLOWING,
    SITTING,
    ATTACKING,
    HOSTILE,
}

export interface Dog extends GameObject {
    hp: number;
    maxHp: number;
    speed: number;
    state: DogState;
    name: string | null;
    ownerId: number | null;
    vx: number;
    vy: number;
    stateTimer: number;
    targetId: string | null;
    lastAttackTime: number;
}


export interface ItemDrop extends GameObject {
    item: Item;
}


export interface Projectile extends GameObject {
  vx: number;
  vy: number;
  damage: number;
  owner: 'player' | 'boss';
  lifespan: number;
  isArrow?: boolean;
  isRocket?: boolean;
  homingTargetId?: string;
}


export interface Building extends GameObject {
    type: 'wall' | 'workbench' | 'block' | 'door' | 'chest' | 'bed' | 'furnace' | 'enchanting_table' | 'tnt';
    material: string;
    hp: number;
    maxHp: number;
    isOpen?: boolean;
    inventory?: InventorySlot[]; // Chest, Furnace
    smeltProgress?: number; // Furnace
    fuelLeft?: number; // Furnace
}

export interface Portal extends GameObject {
    type: 'portal';
    inventory: InventorySlot[];
    isActive: boolean;
    targetDimension: 'OVERWORLD' | 'RUBY';
    sizeX?: number;
    sizeY?: number;
}

export enum NPCType {
    QUEST_GIVER,
    VENDOR
}

export interface NPC extends GameObject {
    type: NPCType;
    name: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  lifespan: number;
  maxLifespan: number;
  color: string;
}

export interface CollectingState {
    nodeId: string;
    progress: number; // 0 to 1
}

export interface TamingState {
    dogId: string;
    progress: number; // 0 to 1
}

export interface EnchantmentOption {
    enchantment: ItemEnchantment;
    description: string;
}

export interface Explosion {
    id: string;
    x: number;
    y: number;
    radius: number;
    createdAt: number;
}
