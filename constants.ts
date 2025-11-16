import { Language, ResourceType, ToolTier, Biome, Quest, Enchantment } from './types';
import type { Item, Tool, Armor, Consumable } from './types';

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;
export const TILE_SIZE = 50;

export const PLAYER_SIZE = 40;
export const PLAYER_SPEED = 4;
export const PLAYER_SPRINT_SPEED = 7;
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_MAX_ENERGY = 100;
export const STAMINA_REGEN_RATE = 0.5;
export const STAMINA_DRAIN_RATE = 1.5;
export const ENERGY_DRAIN_RATE = 0.2; // Energy drains much slower
export const ENERGY_REGEN_PASSIVE_RATE = 0;
export const ENERGY_DAMAGE_AMOUNT = 10;
export const INVENTORY_SLOTS = 20;
export const HOTBAR_SLOTS = 5;
export const CHEST_INVENTORY_SLOTS = 16;
export const FURNACE_INVENTORY_SLOTS = 3; // 0: input, 1: fuel, 2: output
export const PLAYER_LAUNCH_FORCE = 30;

export const DAY_DURATION_MS = 120000; // 2 minutes
export const NIGHT_DURATION_MS = 60000; // 1 minute
export const BLOOD_MOON_DURATION_MS = 180000; // 3 minutes
export const RAIN_DURATION_MS = 120000; // 2 minutes
export const RESOURCE_RESPAWN_MS = 20000; // 20 seconds
export const LAVA_DAMAGE_THRESHOLD_MS = 60000; // 1 minute
export const LAVA_DAMAGE_PER_SECOND = 5;

export const SMELT_TIME = 10000; // 10 seconds per item
export const FUEL_DURATION: { [key: string]: number } = {
    'coal': 80000, // Smelts 8 items
};

export const TNT_RADIUS = 150;
export const TNT_DAMAGE = 100;
export const BAZOOKA_RADIUS = 120;
export const BAZOOKA_DAMAGE = 200;
export const CRATER_DURATION_MS = 120000; // 2 minutes

export const ZOMBIE_DETECTION_RADIUS = 350;
export const ZOMBIE_SOUND_INVESTIGATION_RADIUS = 600;

export const ZOMBIE_STATS: { [key: string]: { color: string; size: number; hp: number; damage: number; speed: number; spawnChance?: number; projectileDamage?: number; slowAttack?: { duration: number, factor: number } } } = {
    NORMAL: { color: '#2C5F2D', size: 40, hp: 50, damage: 5, speed: 2, spawnChance: 0.8 },
    GIANT: { color: '#1A3A1A', size: 60, hp: 150, damage: 15, speed: 1.5, spawnChance: 0.15 },
    IMMORTAL: { color: '#0A1A0A', size: 45, hp: 500, damage: 10, speed: 2.5, spawnChance: 0.05 },
    BOSS: { color: '#8B0000', size: 150, hp: 1000, damage: 30, speed: 1, projectileDamage: 20 },
    RUBY: { color: '#E0115F', size: 50, hp: 200, damage: 20, speed: 2.2, spawnChance: 1.0 },
    DESERT: { color: '#C2B280', size: 40, hp: 40, damage: 5, speed: 2.8 },
    SNOW: { color: '#ADD8E6', size: 45, hp: 70, damage: 7, speed: 1.8, slowAttack: { duration: 3000, factor: 0.5 } },
    FOREST: { color: '#556B2F', size: 40, hp: 50, damage: 5, speed: 2.2 },
    LAVA: { color: '#FF4500', size: 42, hp: 60, damage: 8, speed: 2 },
};

export const ANIMAL_STATS = {
    PIG: { color: '#FFC0CB', size: 35, hp: 20, speed: 1.5 },
    COW: { color: '#FFFFFF', size: 50, hp: 40, speed: 1.2 },
    CHICKEN: { color: '#FFFFE0', size: 20, hp: 10, speed: 2 },
    SHEEP: { color: '#D3D3D3', size: 40, hp: 25, speed: 1.4 },
};

export const DOG_STATS = {
    color: '#4a2c2a',
    size: 38,
    hp: 40,
    speed: 4,
    damage: 8,
    attackCooldown: 800,
    tamingTime: 3000,
};

export const NPC_NAMES = ['Bob', 'Joe', 'Steve', 'Alex', 'Mike', 'Leo', 'Max'];

export const RESOURCE_DATA: { [key in ResourceType | string]: { color: string; requiredTier: ToolTier; baseCollectTime: number } } = {
    [ResourceType.WOOD]: { color: '#8B4513', requiredTier: ToolTier.HAND, baseCollectTime: 3000 },
    [ResourceType.STONE]: { color: '#696969', requiredTier: ToolTier.WOOD, baseCollectTime: 4000 },
    [ResourceType.COAL]: { color: '#36454F', requiredTier: ToolTier.STONE, baseCollectTime: 4500 },
    [ResourceType.IRON]: { color: '#A9A9A9', requiredTier: ToolTier.STONE, baseCollectTime: 5000 },
    [ResourceType.GOLD]: { color: '#FFD700', requiredTier: ToolTier.IRON, baseCollectTime: 7000 },
    [ResourceType.DIAMOND]: { color: '#00BFFF', requiredTier: ToolTier.GOLD, baseCollectTime: 10000 },
    [ResourceType.RUBY]: { color: '#DC143C', requiredTier: ToolTier.DIAMOND, baseCollectTime: 15000 },
    [ResourceType.RUBY_CRYSTAL]: { color: '#FF69B4', requiredTier: ToolTier.DIAMOND, baseCollectTime: 12000 },
    'wood': { color: '#D2B48C', requiredTier: ToolTier.HAND, baseCollectTime: 1000 }, // For refined wood blocks
};

// FIX: Added 'color' property to the BIOME_DATA type to match the object's structure.
export const BIOME_DATA: { [key in Biome]: { color: string; resourceMultipliers: { [key in ResourceType]?: number } } } = {
    [Biome.PLAINS]: { color: '#8BC34A', resourceMultipliers: { [ResourceType.WOOD]: 0.3, [ResourceType.STONE]: 0.3, [ResourceType.COAL]: 0.25, [ResourceType.IRON]: 0.2, [ResourceType.GOLD]: 0.1, [ResourceType.DIAMOND]: 0.05 } },
    [Biome.FOREST]: { color: '#388E3C', resourceMultipliers: { [ResourceType.WOOD]: 1.2, [ResourceType.STONE]: 1.0, [ResourceType.COAL]: 1.1, [ResourceType.IRON]: 1.0, [ResourceType.GOLD]: 0.8, [ResourceType.DIAMOND]: 0.5 } },
    [Biome.DESERT]: { color: '#FFF59D', resourceMultipliers: { [ResourceType.WOOD]: 0.1, [ResourceType.STONE]: 2.0, [ResourceType.COAL]: 1.5, [ResourceType.IRON]: 1.2, [ResourceType.GOLD]: 1.0, [ResourceType.DIAMOND]: 0.3 } },
    [Biome.SNOW]: { color: '#E0E0E0', resourceMultipliers: { [ResourceType.WOOD]: 1.5, [ResourceType.STONE]: 1.5, [ResourceType.COAL]: 0.8, [ResourceType.IRON]: 0.5, [ResourceType.GOLD]: 0.3, [ResourceType.DIAMOND]: 0.1 } },
    [Biome.LAVA]: { color: '#FF7043', resourceMultipliers: { [ResourceType.WOOD]: 0.0, [ResourceType.STONE]: 1.2, [ResourceType.COAL]: 1.8, [ResourceType.IRON]: 1.5, [ResourceType.GOLD]: 2.0, [ResourceType.DIAMOND]: 1.5 } },
    [Biome.WATER]: { color: '#4FC3F7', resourceMultipliers: {} },
    [Biome.RUBY]: { color: '#6A0DAD', resourceMultipliers: { [ResourceType.WOOD]: 0.0, [ResourceType.STONE]: 0.5, [ResourceType.COAL]: 0.5, [ResourceType.IRON]: 0.5, [ResourceType.GOLD]: 0.5, [ResourceType.DIAMOND]: 1.0, [ResourceType.RUBY]: 3.0, [ResourceType.RUBY_CRYSTAL]: 2.0 } },
};

export const BLOCK_HP: { [key: string]: number } = {
    'wood': 20,
    'stone': 40,
    'iron': 60,
    'gold': 80,
    'diamond': 90,
    'ruby': 100,
};

export const ITEMS: { [id: string]: Item | Tool | Armor | Consumable } = {
    // Resources
    'wood': { id: 'wood', name: 'Wood', name_pt: 'Madeira', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'stone': { id: 'stone', name: 'Stone', name_pt: 'Pedra', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'coal': { id: 'coal', name: 'Coal', name_pt: 'Carvão', type: 'fuel', quantity: 1, stackable: true, maxStack: 64, fuelTime: 80000 },
    'iron_ore': { id: 'iron_ore', name: 'Iron Ore', name_pt: 'Minério de Ferro', type: 'smeltable', quantity: 1, stackable: true, maxStack: 64, smeltResult: 'iron_ingot' },
    'gold_ore': { id: 'gold_ore', name: 'Gold Ore', name_pt: 'Minério de Ouro', type: 'smeltable', quantity: 1, stackable: true, maxStack: 64, smeltResult: 'gold_ingot' },
    'diamond': { id: 'diamond', name: 'Diamond', name_pt: 'Diamante', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'ruby': { id: 'ruby', name: 'Ruby', name_pt: 'Rubi', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'ruby_crystal': { id: 'ruby_crystal', name: 'Ruby Crystal', name_pt: 'Cristal de Rubi', type: 'resource', quantity: 1, stackable: true, maxStack: 64 },
    'money': { id: 'money', name: 'Coin', name_pt: 'Moeda', type: 'currency', quantity: 1, stackable: true, maxStack: 999 },
    
    // Crafting Materials
    'refined_wood': { id: 'refined_wood', name: 'Refined Wood', name_pt: 'Madeira Refinada', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'wool': { id: 'wool', name: 'Wool', name_pt: 'Lã', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'iron_ingot': { id: 'iron_ingot', name: 'Iron Ingot', name_pt: 'Barra de Ferro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'gold_ingot': { id: 'gold_ingot', name: 'Gold Ingot', name_pt: 'Barra de Ouro', type: 'crafting_material', quantity: 1, stackable: true, maxStack: 64 },
    'arrow': { id: 'arrow', name: 'Arrow', name_pt: 'Flecha', type: 'ammo', quantity: 1, stackable: true, maxStack: 64 },
    'rocket': { id: 'rocket', name: 'Rocket', name_pt: 'Míssil', type: 'ammo', quantity: 1, stackable: true, maxStack: 16 },

    // Placeable Blocks
    'workbench': { id: 'workbench', name: 'Workbench', name_pt: 'Bancada', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'enchanting_table': { id: 'enchanting_table', name: 'Enchanting Table', name_pt: 'Mesa de Encantamentos', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'chest': { id: 'chest', name: 'Chest', name_pt: 'Baú', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'bed': { id: 'bed', name: 'Bed', name_pt: 'Cama', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'furnace': { id: 'furnace', name: 'Furnace', name_pt: 'Fornalha', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'tnt': { id: 'tnt', name: 'TNT', name_pt: 'TNT', type: 'block', quantity: 1, stackable: true, maxStack: 64 },

    // Consumables
    'food': { id: 'food', name: 'Raw Meat', name_pt: 'Carne Crua', type: 'smeltable', heals: -5, quantity: 1, stackable: true, maxStack: 64, smeltResult: 'cooked_meat' },
    'cooked_meat': { id: 'cooked_meat', name: 'Cooked Meat', name_pt: 'Carne Assada', type: 'consumable', heals: 20, quantity: 1, stackable: true, maxStack: 64 },
    'apple': { id: 'apple', name: 'Apple', name_pt: 'Maçã', type: 'consumable', heals: 10, quantity: 1, stackable: true, maxStack: 64 },
    'health_potion': { id: 'health_potion', name: 'Health Potion', name_pt: 'Poção de Vida', type: 'consumable', heals: 50, quantity: 1, stackable: true, maxStack: 10 },
    'stamina_potion': { id: 'stamina_potion', name: 'Stamina Potion', name_pt: 'Poção de Vigor', type: 'consumable', stamina: 100, quantity: 1, stackable: true, maxStack: 10 },
    
    // Other
    'ammo': { id: 'ammo', name: 'Ammo', name_pt: 'Munição', type: 'ammo', quantity: 1, stackable: true, maxStack: 999 },
    'torch': { id: 'torch', name: 'Torch', name_pt: 'Tocha', type: 'light_source', quantity: 1, stackable: true, maxStack: 64 },
    'shield': { id: 'shield', name: 'Shield', name_pt: 'Escudo', type: 'shield', quantity: 1, stackable: false, maxStack: 1, durability: 337, maxDurability: 337 },
    'totem_ruby': { id: 'totem_ruby', name: 'Ruby Totem', name_pt: 'Totem de Rubi', type: 'totem', quantity: 1, stackable: false, maxStack: 1 },

    // Tools - Pickaxes
    'pickaxe_wood': { id: 'pickaxe_wood', name: 'Wood Pickaxe', name_pt: 'Picareta de Madeira', type: 'tool', toolType: 'pickaxe', tier: ToolTier.WOOD, collectSpeed: 1.2, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60 },
    'pickaxe_stone': { id: 'pickaxe_stone', name: 'Stone Pickaxe', name_pt: 'Picareta de Pedra', type: 'tool', toolType: 'pickaxe', tier: ToolTier.STONE, collectSpeed: 1.5, quantity: 1, stackable: false, maxStack: 1, durability: 132, maxDurability: 132 },
    'pickaxe_iron': { id: 'pickaxe_iron', name: 'Iron Pickaxe', name_pt: 'Picareta de Ferro', type: 'tool', toolType: 'pickaxe', tier: ToolTier.IRON, collectSpeed: 2, quantity: 1, stackable: false, maxStack: 1, durability: 251, maxDurability: 251 },
    'pickaxe_gold': { id: 'pickaxe_gold', name: 'Gold Pickaxe', name_pt: 'Picareta de Ouro', type: 'tool', toolType: 'pickaxe', tier: ToolTier.GOLD, collectSpeed: 2.8, quantity: 1, stackable: false, maxStack: 1, durability: 33, maxDurability: 33 },
    'pickaxe_diamond': { id: 'pickaxe_diamond', name: 'Diamond Pickaxe', name_pt: 'Picareta de Diamante', type: 'tool', toolType: 'pickaxe', tier: ToolTier.DIAMOND, collectSpeed: 4, quantity: 1, stackable: false, maxStack: 1, durability: 1562, maxDurability: 1562 },
    
    // Tools - Axes
    'axe_wood': { id: 'axe_wood', name: 'Wood Axe', name_pt: 'Machado de Madeira', type: 'tool', toolType: 'axe', tier: ToolTier.WOOD, collectSpeed: 1.5, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60 },
    'axe_stone': { id: 'axe_stone', name: 'Stone Axe', name_pt: 'Machado de Pedra', type: 'tool', toolType: 'axe', tier: ToolTier.STONE, collectSpeed: 2, quantity: 1, stackable: false, maxStack: 1, durability: 132, maxDurability: 132 },
    'axe_iron': { id: 'axe_iron', name: 'Iron Axe', name_pt: 'Machado de Ferro', type: 'tool', toolType: 'axe', tier: ToolTier.IRON, collectSpeed: 2.5, quantity: 1, stackable: false, maxStack: 1, durability: 251, maxDurability: 251 },
    'axe_gold': { id: 'axe_gold', name: 'Gold Axe', name_pt: 'Machado de Ouro', type: 'tool', toolType: 'axe', tier: ToolTier.GOLD, collectSpeed: 3.5, quantity: 1, stackable: false, maxStack: 1, durability: 33, maxDurability: 33 },
    'axe_diamond': { id: 'axe_diamond', name: 'Diamond Axe', name_pt: 'Machado de Diamante', type: 'tool', toolType: 'axe', tier: ToolTier.DIAMOND, collectSpeed: 5, quantity: 1, stackable: false, maxStack: 1, durability: 1562, maxDurability: 1562 },
    'axe_ruby': { id: 'axe_ruby', name: 'Ruby Axe', name_pt: 'Machado de Rubi', type: 'tool', toolType: 'axe', tier: ToolTier.RUBY, collectSpeed: 8, quantity: 1, stackable: false, maxStack: 1, durability: 2032, maxDurability: 2032 },

    // Weapons - Swords
    'sword_wood': { id: 'sword_wood', name: 'Wood Sword', name_pt: 'Espada de Madeira', type: 'tool', toolType: 'sword', damage: 5, tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 60, maxDurability: 60 },
    'sword_stone': { id: 'sword_stone', name: 'Stone Sword', name_pt: 'Espada de Pedra', type: 'tool', toolType: 'sword', damage: 10, tier: ToolTier.STONE, quantity: 1, stackable: false, maxStack: 1, durability: 132, maxDurability: 132 },
    'sword_iron': { id: 'sword_iron', name: 'Iron Sword', name_pt: 'Espada de Ferro', type: 'tool', toolType: 'sword', damage: 15, tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 251, maxDurability: 251 },
    'sword_gold': { id: 'sword_gold', name: 'Gold Sword', name_pt: 'Espada de Ouro', type: 'tool', toolType: 'sword', damage: 20, tier: ToolTier.GOLD, quantity: 1, stackable: false, maxStack: 1, durability: 33, maxDurability: 33 },
    'sword_diamond': { id: 'sword_diamond', name: 'Diamond Sword', name_pt: 'Espada de Diamante', type: 'tool', toolType: 'sword', damage: 25, tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 1562, maxDurability: 1562 },
    'sword_ruby': { id: 'sword_ruby', name: 'Ruby Sword', name_pt: 'Espada de Rubi', type: 'tool', toolType: 'sword', damage: 30, tier: ToolTier.RUBY, quantity: 1, stackable: false, maxStack: 1, durability: 2032, maxDurability: 2032 },

    // Weapons - Ranged
    'pistol': { id: 'pistol', name: 'Pistol', name_pt: 'Pistola', type: 'tool', toolType: 'pistol', damage: 15, tier: ToolTier.IRON, quantity: 1, stackable: false, maxStack: 1, durability: 251, maxDurability: 251 },
    'rifle': { id: 'rifle', name: 'Rifle', name_pt: 'Rifle', type: 'tool', toolType: 'rifle', damage: 20, tier: ToolTier.GOLD, quantity: 1, stackable: false, maxStack: 1, durability: 132, maxDurability: 132 },
    'ak47': { id: 'ak47', name: 'AK-47', name_pt: 'AK-47', type: 'tool', toolType: 'ak47', damage: 15, shotsPerBurst: 2, tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 500, maxDurability: 500 },
    'bow': { id: 'bow', name: 'Bow', name_pt: 'Arco', type: 'tool', toolType: 'bow', damage: 12, tier: ToolTier.WOOD, quantity: 1, stackable: false, maxStack: 1, durability: 385, maxDurability: 385 },
    'bazooka': { id: 'bazooka', name: 'Bazooka', name_pt: 'Bazuca', type: 'tool', toolType: 'bazooka', damage: 200, tier: ToolTier.DIAMOND, quantity: 1, stackable: false, maxStack: 1, durability: 200, maxDurability: 200 },

    // Armor
    'armor_iron': { id: 'armor_iron', name: 'Iron Armor', name_pt: 'Armadura de Ferro', type: 'armor', defense: 0.15, material: 'iron', quantity: 1, stackable: false, maxStack: 1, durability: 251, maxDurability: 251 },
    'armor_gold': { id: 'armor_gold', name: 'Gold Armor', name_pt: 'Armadura de Ouro', type: 'armor', defense: 0.25, material: 'gold', quantity: 1, stackable: false, maxStack: 1, durability: 67, maxDurability: 67 },
    'armor_diamond': { id: 'armor_diamond', name: 'Diamond Armor', name_pt: 'Armadura de Diamante', type: 'armor', defense: 0.40, material: 'diamond', quantity: 1, stackable: false, maxStack: 1, durability: 1562, maxDurability: 1562 },
    'armor_ruby': { id: 'armor_ruby', name: 'Ruby Armor', name_pt: 'Armadura de Rubi', type: 'armor', defense: 0.5, material: 'ruby', quantity: 1, stackable: false, maxStack: 1, durability: 2032, maxDurability: 2032 },
    
    // Building Blocks
    'wood_block': { id: 'wood_block', name: 'Wood Block', name_pt: 'Bloco de Madeira', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'stone_block': { id: 'stone_block', name: 'Stone Block', name_pt: 'Bloco de Pedra', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'iron_block': { id: 'iron_block', name: 'Iron Block', name_pt: 'Bloco de Ferro', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'gold_block': { id: 'gold_block', name: 'Gold Block', name_pt: 'Bloco de Ouro', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'diamond_block': { id: 'diamond_block', name: 'Diamond Block', name_pt: 'Bloco de Diamante', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'ruby_block': { id: 'ruby_block', name: 'Ruby Block', name_pt: 'Bloco de Rubi', type: 'block', quantity: 1, stackable: true, maxStack: 64 },

    'wood_door': { id: 'wood_door', name: 'Wood Door', name_pt: 'Porta de Madeira', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
    'iron_door': { id: 'iron_door', name: 'Iron Door', name_pt: 'Porta de Ferro', type: 'block', quantity: 1, stackable: true, maxStack: 64 },
};

export const ENCHANTMENT_DATA: { [key in Enchantment]: { name_en: string; name_pt: string; maxLevel: number; applicableTo: ('pickaxe' | 'sword' | 'armor' | 'ranged' | 'any')[] } } = {
    [Enchantment.EFFICIENCY]: { name_en: 'Efficiency', name_pt: 'Eficiência', maxLevel: 5, applicableTo: ['pickaxe'] },
    [Enchantment.SHARPNESS]: { name_en: 'Sharpness', name_pt: 'Afiação', maxLevel: 5, applicableTo: ['sword'] },
    [Enchantment.PROTECTION]: { name_en: 'Protection', name_pt: 'Proteção', maxLevel: 4, applicableTo: ['armor'] },
    [Enchantment.HOMING]: { name_en: 'Homing', name_pt: 'Mira', maxLevel: 1, applicableTo: ['ranged'] },
    [Enchantment.THORNS]: { name_en: 'Thorns', name_pt: 'Espinhos', maxLevel: 3, applicableTo: ['armor'] },
    [Enchantment.MENDING]: { name_en: 'Mending', name_pt: 'Reparação', maxLevel: 1, applicableTo: ['any'] },
    [Enchantment.LOOTING]: { name_en: 'Looting', name_pt: 'Pilhagem', maxLevel: 3, applicableTo: ['sword'] },
    [Enchantment.UNBREAKING]: { name_en: 'Unbreaking', name_pt: 'Inquebrável', maxLevel: 3, applicableTo: ['any'] },
};

export const CREATIVE_ITEMS = Object.values(ITEMS);

export const VENDOR_ITEMS: { [itemId: string]: { price: number } } = {
    'sword_ruby': { price: 1000 },
    'ak47': { price: 1250 },
    'bow': { price: 200 },
    'arrow': { price: 30 }, // Per stack of 10
    'armor_ruby': { price: 950 },
    'health_potion': { price: 75 },
    'stamina_potion': { price: 60 },
    'cooked_meat': { price: 40 }, // Per stack of 5
    'apple': { price: 20 },
    'diamond': { price: 150 },
    'ruby': { price: 225 },
    'totem_ruby': { price: 1500 },
    'shield': { price: 350 },
    'ammo': { price: 75 }, // Per stack of 50
    'pickaxe_diamond': { price: 500 },
    'axe_ruby': { price: 650 },
    'refined_wood': { price: 50 }, // Per stack of 32
    'stone': { price: 50 }, // Per stack of 32
    'chest': { price: 100 },
    'iron_ingot': { price: 120 }, // Per stack of 16
};

export const QUEST_LIST: Quest[] = [
    { id: 'q1', type: 'collect', itemId: 'wood', requiredAmount: 20, rewardMin: 10, rewardMax: 30, description_en: 'Collect 20 Wood', description_pt: 'Colete 20 Madeiras' },
    { id: 'q2', type: 'collect', itemId: 'stone', requiredAmount: 30, rewardMin: 15, rewardMax: 40, description_en: 'Collect 30 Stone', description_pt: 'Colete 30 Pedras' },
    { id: 'q3', type: 'collect', itemId: 'coal', requiredAmount: 10, rewardMin: 20, rewardMax: 50, description_en: 'Collect 10 Coal', description_pt: 'Colete 10 Carvões' },
    { id: 'q4', type: 'collect', itemId: 'food', requiredAmount: 5, rewardMin: 25, rewardMax: 60, description_en: 'Hunt for 5 Raw Meat', description_pt: 'Cace 5 Carnes Cruas' },
    { id: 'q5', type: 'collect', itemId: 'iron_ore', requiredAmount: 8, rewardMin: 40, rewardMax: 80, description_en: 'Mine 8 Iron Ore', description_pt: 'Minere 8 Minérios de Ferro' },
    { id: 'q6', type: 'collect', itemId: 'wool', requiredAmount: 5, rewardMin: 20, rewardMax: 45, description_en: 'Gather 5 Wool', description_pt: 'Junte 5 Lãs' },
];

export const INVENTORY_CRAFTING_RECIPES = new Map<string, { result: Item, quantity: number }>();
INVENTORY_CRAFTING_RECIPES.set(JSON.stringify(['wood', 'wood', 'wood', 'wood']), { result: ITEMS['workbench'], quantity: 1 });
INVENTORY_CRAFTING_RECIPES.set(JSON.stringify(['ruby_crystal', 'ruby_crystal', 'ruby_crystal', 'ruby_crystal']), { result: ITEMS['enchanting_table'], quantity: 1 });


export const CRAFTING_RECIPES: { [itemId: string]: { [resourceId: string]: number } } = {
    'refined_wood': { 'wood': 1 },
    'furnace': { 'stone': 8 },
    
    'bed': { 'refined_wood': 10, 'wool': 3 },
    'torch': { 'refined_wood': 1, 'coal': 1 },
    'shield': { 'iron_ingot': 10, 'refined_wood': 5 },
    'bow': { 'refined_wood': 15 },
    'arrow': { 'refined_wood': 1, 'stone': 1 }, // Yields 4 arrows
    'tnt': { 'coal': 4, 'stone': 5 },

    'wood_block': { 'refined_wood': 2 },
    'stone_block': { 'stone': 2 },
    'iron_block': { 'iron_ingot': 2 },
    'gold_block': { 'gold_ingot': 2 },
    'diamond_block': { 'diamond': 2 },
    'ruby_block': { 'ruby': 2 },

    'wood_door': { 'refined_wood': 6 },
    'iron_door': { 'iron_ingot': 6 },
    'chest': { 'refined_wood': 8 },

    'pickaxe_wood': { 'wood': 2, 'refined_wood': 3 },
    'pickaxe_stone': { 'wood': 2, 'stone': 3 },
    'pickaxe_iron': { 'wood': 2, 'iron_ingot': 3 },
    'pickaxe_gold': { 'wood': 2, 'gold_ingot': 3 },
    'pickaxe_diamond': { 'wood': 2, 'diamond': 3 },

    'axe_wood': { 'wood': 2, 'refined_wood': 3 },
    'axe_stone': { 'wood': 2, 'stone': 3 },
    'axe_iron': { 'wood': 2, 'iron_ingot': 3 },
    'axe_gold': { 'wood': 2, 'gold_ingot': 3 },
    'axe_diamond': { 'wood': 2, 'diamond': 3 },
    'axe_ruby': { 'wood': 2, 'ruby': 3 },
    
    'sword_wood': { 'wood': 2, 'refined_wood': 3 },
    'sword_stone': { 'wood': 2, 'stone': 3 },
    'sword_iron': { 'wood': 2, 'iron_ingot': 3 },
    'sword_gold': { 'wood': 2, 'gold_ingot': 3 },
    'sword_diamond': { 'wood': 2, 'diamond': 3 },
    'sword_ruby': { 'wood': 2, 'ruby': 3 },
    
    'pistol': { 'iron_ingot': 10, 'gold_ingot': 1 },
    'rifle': { 'gold_ingot': 5, 'iron_ingot': 5 },
    'ak47': { 'gold_ingot': 10, 'diamond': 1 },
    'bazooka': { 'iron_ingot': 20, 'diamond': 5, 'ruby': 2 },
    'ammo': { 'gold_ingot': 1 },
    'rocket': { 'gold_ingot': 5, 'coal': 1 },

    'armor_iron': { 'iron_ingot': 15 },
    'armor_gold': { 'gold_ingot': 15 },
    'armor_diamond': { 'diamond': 20 },
    'armor_ruby': { 'ruby': 20 },
};

export const PORTAL_REQUIREMENTS: { [itemId: string]: number } = {
    'iron_ingot': 5,
    'gold_ingot': 5,
    'diamond': 7,
};
export const PORTAL_INVENTORY_SLOTS = 5;

export const translations: { [lang in Language]: { [key: string]: string } } = {
    [Language.EN]: {
        play: 'Play',
        inventory: 'Inventory',
        shop: 'Shop',
        day: 'Day',
        creative: '(Creative)',
        hp: 'HP',
        stamina: 'Stamina',
        energy: 'Energy',
        ammo: 'Ammo',
        close: 'Close',
        youDied: 'You Died',
        restart: 'Restart',
        buy: 'Buy',
        weapon: 'Weapon',
        armor: 'Armor',
        tool: 'Tool',
        crafting: 'Crafting',
        workbench: 'Workbench',
        furnace: 'Furnace',
        input: 'Input',
        fuel: 'Fuel',
        output: 'Output',
        craft: 'Craft',
        craftableItems: 'Craftable Items',
        creativeTools: 'Creative Tools',
        itemMenu: 'Item Menu (C)',
        flyNoclip: 'Fly/Noclip (V)',
        invisibility: 'Invisibility (H)',
        on: 'ON',
        off: 'OFF',
        spawn: 'Spawn',
        spawnZombie: 'Spawn Zombie',
        normal: 'Normal',
        giant: 'Giant',
        immortal: 'Immortal',
        boss: 'Boss',
        teleport: 'Teleport',
        center: 'Center',
        border: 'Border',
        go: 'Go',
        continue: 'Continue',
        newGame: 'New Game',
        gameSaved: 'Game Saved!',
        bloodMoon: 'Blood Moon',
        rain: 'Rain',
        toggleBloodMoon: 'Toggle Blood Moon',
        toggleRain: 'Toggle Rain',
        biome: 'Biome',
        placeBlock: 'Place Block (Z)',
        door: 'Door',
        chest: 'Chest',
        portalInventory: 'Portal Offering',
        enterDimension: 'Enter Dimension?',
        returnToOverworld: 'Return to Overworld? (E)',
        offHand: 'Off-hand',
        sleep: 'Sleep (E)',
        cannotSleepNow: 'Can only sleep at night.',
        cannotSleepBloodMoon: 'Cannot sleep during a Blood Moon!',
        skipNight: 'Skip to morning?',
        yes: 'Yes',
        no: 'No',
        shield: 'Shield',
        totemOfRuby: 'Ruby Totem',
        playerStats: 'Player Stats',
        decreaseHP: '- HP',
        decreaseStamina: '- Stamina',
        decreaseEnergy: '- Energy',
        objective: 'Objective',
        mission: 'Mission',
        accept: 'Accept',
        decline: 'Decline',
        reward: 'Reward',
        completeQuest: 'Complete Quest?',
        handOverItems: 'Hand over items?',
        hitler: 'Hitler',
        claudio: 'Claudio',
        yourCoins: 'Your Coins',
        nameYourPet: 'Name your new companion:',
        namePet: 'Name Pet',
        enchantingTable: 'Enchanting Table',
        enchant: 'Enchant',
        enchantments: 'Enchantments',
        worldControls: 'World Controls',
        skipDay: 'Skip Day',
        toggleDayNight: 'Day/Night',
        clearWeather: 'Clear Weather',
        playerCheats: 'Player Cheats',
        heal: 'Heal',
        maxStats: 'Max Stats',
        giveMoney: 'Give Money',
        giveAmmo: 'Give Ammo',
        clearInv: 'Clear Inv.',
        entityManagement: 'Entity Management',
        killZombies: 'Kill Zombies',
        spawnTamedDog: 'Spawn Dog',
        pig: 'Pig',
        cow: 'Cow',
        chicken: 'Chicken',
        sheep: 'Sheep',
    },
    [Language.PT]: {
        play: 'Jogar',
        inventory: 'Inventário',
        shop: 'Loja',
        day: 'Dia',
        creative: '(Criativo)',
        hp: 'Vida',
        stamina: 'Estamina',
        energy: 'Energia',
        ammo: 'Munição',
        close: 'Fechar',
        youDied: 'Você Morreu',
        restart: 'Recomeçar',
        buy: 'Comprar',
        weapon: 'Arma',
        armor: 'Armadura',
        tool: 'Ferramenta',
        crafting: 'Criação',
        workbench: 'Bancada de Trabalho',
        furnace: 'Fornalha',
        input: 'Entrada',
        fuel: 'Combustível',
        output: 'Saída',
        craft: 'Criar',
        craftableItems: 'Itens Criáveis',
        creativeTools: 'Ferramentas Criativas',
        itemMenu: 'Menu de Itens (C)',
        flyNoclip: 'Voar/Noclip (V)',
        invisibility: 'Invisibilidade (H)',
        on: 'LIGADO',
        off: 'DESLIGADO',
        spawn: 'Gerar',
        spawnZombie: 'Gerar Zumbi',
        normal: 'Normal',
        giant: 'Gigante',
        immortal: 'Imortal',
        boss: 'Chefe',
        teleport: 'Teleportar',
        center: 'Centro',
        borda: 'Borda',
        go: 'Ir',
        continue: 'Continuar',
        newGame: 'Novo Jogo',
        gameSaved: 'Jogo Salvo!',
        bloodMoon: 'Lua de Sangue',
        rain: 'Chuva',
        toggleBloodMoon: 'Alternar Lua de Sangue',
        toggleRain: 'Alternar Chuva',
        biome: 'Bioma',
        placeBlock: 'Colocar Bloco (Z)',
        door: 'Porta',
        chest: 'Baú',
        portalInventory: 'Oferenda do Portal',
        enterDimension: 'Entrar na Dimensão?',
        returnToOverworld: 'Voltar para o Mundo Principal? (E)',
        offHand: 'Segunda Mão',
        sleep: 'Dormir (E)',
        cannotSleepNow: 'Só se pode dormir à noite.',
        cannotSleepBloodMoon: 'Não se pode dormir durante a Lua de Sangue!',
        skipNight: 'Pular para a manhã?',
        yes: 'Sim',
        no: 'Não',
        shield: 'Escudo',
        totemOfRuby: 'Totem de Rubi',
        playerStats: 'Atributos do Jogador',
        decreaseHP: '- Vida',
        decreaseStamina: '- Estamina',
        decreaseEnergy: '- Energia',
        objective: 'Objetivo',
        mission: 'Missão',
        accept: 'Aceitar',
        decline: 'Recusar',
        reward: 'Recompensa',
        completeQuest: 'Completar Missão?',
        handOverItems: 'Entregar itens?',
        hitler: 'Hitler',
        claudio: 'Claudio',
        yourCoins: 'Suas Moedas',
        nameYourPet: 'Dê um nome ao seu novo companheiro:',
        namePet: 'Nomear',
        enchantingTable: 'Mesa de Encantamentos',
        enchant: 'Encantar',
        enchantments: 'Encantamentos',
        worldControls: 'Controles do Mundo',
        skipDay: 'Pular Dia',
        toggleDayNight: 'Dia/Noite',
        clearWeather: 'Limpar Clima',
        playerCheats: 'Truques do Jogador',
        heal: 'Curar',
        maxStats: 'Stats Máx.',
        giveMoney: 'Dar Dinheiro',
        giveAmmo: 'Dar Munição',
        clearInv: 'Limpar Inv.',
        entityManagement: 'Gerenciar Entidades',
        killZombies: 'Matar Zumbis',
        spawnTamedDog: 'Gerar Cão',
        pig: 'Porco',
        cow: 'Vaca',
        chicken: 'Galinha',
        sheep: 'Ovelha',
    }
};