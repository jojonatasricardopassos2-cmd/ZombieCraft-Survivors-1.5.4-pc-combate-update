


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, ResourceType, ToolTier, ZombieType, Language, AnimalType, Biome, NPCType, ZombieState, DogState, Enchantment } from './types';
import type { Player, ResourceNode, Zombie, Projectile, InventorySlot, Item, Tool, CollectingState, Building, Armor, Animal, ItemDrop, Consumable, Portal, Particle, NPC, Quest, TamingState, Dog, EnchantmentOption, ItemEnchantment, Explosion } from './types';
// FIX: import `translations` to be used for NPC name localization.
import {
  WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_MAX_HP, PLAYER_MAX_STAMINA, STAMINA_REGEN_RATE, STAMINA_DRAIN_RATE, DAY_DURATION_MS, NIGHT_DURATION_MS, BLOOD_MOON_DURATION_MS, RAIN_DURATION_MS, RESOURCE_RESPAWN_MS, ZOMBIE_STATS, ANIMAL_STATS, DOG_STATS, RESOURCE_DATA, ITEMS, INVENTORY_SLOTS, HOTBAR_SLOTS, INVENTORY_CRAFTING_RECIPES, CRAFTING_RECIPES, BIOME_DATA, LAVA_DAMAGE_THRESHOLD_MS, LAVA_DAMAGE_PER_SECOND, BLOCK_HP, PORTAL_INVENTORY_SLOTS, CHEST_INVENTORY_SLOTS, PLAYER_MAX_ENERGY, ENERGY_DRAIN_RATE, ENERGY_REGEN_PASSIVE_RATE, ENERGY_DAMAGE_AMOUNT, SMELT_TIME, FUEL_DURATION, FURNACE_INVENTORY_SLOTS, NPC_NAMES, QUEST_LIST, ZOMBIE_DETECTION_RADIUS, ZOMBIE_SOUND_INVESTIGATION_RADIUS, translations, ENCHANTMENT_DATA, TNT_RADIUS, TNT_DAMAGE, BAZOOKA_RADIUS, BAZOOKA_DAMAGE, CRATER_DURATION_MS, PLAYER_LAUNCH_FORCE
} from './constants';
import GameUI from './components/GameUI';
import { playSound, stopSound, stopAllSounds } from './audioManager';
import { SOUNDS } from './sounds';

const SAVE_KEY = 'zombieCraftSave';

const createInitialPlayer = (): Player => {
  return {
    id: 1,
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    size: PLAYER_SIZE,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    stamina: PLAYER_MAX_STAMINA,
    maxStamina: PLAYER_MAX_STAMINA,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
    money: 0,
    ammo: 10,
    inventory: Array.from({ length: INVENTORY_SLOTS }, () => ({ item: null })),
    craftingGrid: Array.from({ length: 4 }, () => ({ item: null })),
    craftingOutput: { item: null },
    enchantingSlots: Array.from({ length: 2 }, () => ({ item: null })),
    activeSlot: 0,
    armor: null,
    weapon: null,
    tool: null,
    offHand: { item: null },
    speed: PLAYER_SPEED,
    sprinting: false,
    lastAttackTime: 0,
    lavaDamageTimer: 0,
    lastDamageTime: 0,
    lastEnergyDamageTime: 0,
    dimension: 'OVERWORLD',
    overworldX: WORLD_WIDTH / 2,
    overworldY: WORLD_HEIGHT / 2,
    activeQuest: null,
  };
}

// Biome generation logic
const centerSize = 1200;
const riverWidth = 100;
const centerStartX = (WORLD_WIDTH - centerSize) / 2;
const centerEndX = centerStartX + centerSize;
const centerStartY = (WORLD_HEIGHT - centerSize) / 2;
const centerEndY = centerStartY + centerSize;

const getBiomeAt = (x: number, y: number, dimension: 'OVERWORLD' | 'RUBY' = 'OVERWORLD'): Biome => {
    if (dimension === 'RUBY') return Biome.RUBY;

    const isTop = y < centerStartY;
    const isBottom = y > centerEndY;
    const isLeft = x < centerStartX;
    const isRight = x > centerEndX;

    // Corners
    if (isTop && isLeft) return Biome.DESERT;
    if (isTop && isRight) return Biome.LAVA;
    if (isBottom && isLeft) return Biome.FOREST;
    if (isBottom && isRight) return Biome.SNOW;

    // Rivers (Cross shape)
    if (Math.abs(x - centerStartX) < riverWidth / 2 ||
        Math.abs(x - centerEndX) < riverWidth / 2 ||
        Math.abs(y - centerStartY) < riverWidth / 2 ||
        Math.abs(y - centerEndY) < riverWidth / 2) {
        return Biome.WATER;
    }

    // Center Plains
    return Biome.PLAINS;
};


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [language, setLanguage] = useState<Language>(Language.PT);
  const [player, setPlayer] = useState(createInitialPlayer());
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [itemDrops, setItemDrops] = useState<ItemDrop[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [day, setDay] = useState(1);
  const [isNight, setIsNight] = useState(false);
  const [timeInCycle, setTimeInCycle] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [collectingState, setCollectingState] = useState<CollectingState | null>(null);
  const [tamingState, setTamingState] = useState<TamingState | null>(null);
  const [dogBeingNamed, setDogBeingNamed] = useState<Dog | null>(null);
  const [currentBiome, setCurrentBiome] = useState<Biome>(Biome.PLAINS);
  const [enchantmentOptions, setEnchantmentOptions] = useState<EnchantmentOption[]>([]);

  // Event States
  const [isBloodMoon, setIsBloodMoon] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const [rainTimer, setRainTimer] = useState(0);
  const [destroyedResources, setDestroyedResources] = useState<ResourceNode[]>([]);

  // Creative Mode State
  const [creativeMode, setCreativeMode] = useState(false);
  const [invisible, setInvisible] = useState(false);
  const [noclip, setNoclip] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // UI State
  const [activePortal, setActivePortal] = useState<Portal | null>(null);
  const [activeChest, setActiveChest] = useState<Building | null>(null);
  const [activeFurnace, setActiveFurnace] = useState<Building | null>(null);
  const [activeEnchantingTable, setActiveEnchantingTable] = useState<Building | null>(null);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [isNearReturnPortal, setIsNearReturnPortal] = useState(false);
  const [showSleepConfirm, setShowSleepConfirm] = useState(false);

  // Save/Load State
  const [saveExists, setSaveExists] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTime = useRef<number>(performance.now());
  const gameLoopRef = useRef<number | null>(null);
  const lastFootstepTime = useRef(0);
  const mendingTimers = useRef<{ [itemId: string]: number }>({}).current;

  const camera = {
    x: player.x - window.innerWidth / 2,
    y: player.y - window.innerHeight / 2
  };
  
  const generateResources = useCallback((dimension: 'OVERWORLD' | 'RUBY') => {
    const newResources: ResourceNode[] = [];
    const totalResources = dimension === 'RUBY' ? 200 : 500;

    for (let i = 0; i < totalResources; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        const biome = getBiomeAt(x, y, dimension);

        if (biome === Biome.WATER) continue;

        const biomeMultipliers = BIOME_DATA[biome].resourceMultipliers;
        const rand = Math.random();
        let cumulativeProb = 0;

        if (dimension === 'OVERWORLD') {
            // Spawn wood (trees)
            if (Math.random() < (0.4 * (biomeMultipliers[ResourceType.WOOD] ?? 0))) {
                 newResources.push({
                    id: `tree_${i}`, x, y, size: TILE_SIZE * 1.2,
                    type: ResourceType.WOOD, hp: 100, maxHp: 100, respawnTimer: 0
                });
                continue;
            }
        }
        
        // Spawn ores/stone
        const resourceTypes = dimension === 'OVERWORLD'
            ? [ResourceType.STONE, ResourceType.COAL, ResourceType.IRON, ResourceType.GOLD, ResourceType.DIAMOND]
            : [ResourceType.STONE, ResourceType.COAL, ResourceType.IRON, ResourceType.GOLD, ResourceType.DIAMOND, ResourceType.RUBY, ResourceType.RUBY_CRYSTAL];
            
        for (const type of resourceTypes) {
            const baseProbability = { STONE: 0.5, COAL: 0.3, IRON: 0.3, GOLD: 0.15, DIAMOND: 0.04, RUBY: 0.04, RUBY_CRYSTAL: 0.05 }[type]!;
            const biomeMultiplier = biomeMultipliers[type] ?? 1.0;
            cumulativeProb += baseProbability * biomeMultiplier;

            if (rand < cumulativeProb) {
                newResources.push({ id: `res_${dimension}_${i}`, x, y, size: TILE_SIZE, type, hp: 100, maxHp: 100, respawnTimer: 0 });
                break;
            }
        }
    }
    setResources(newResources);
  }, []);

  const generateStructure = useCallback((centerX: number, centerY: number, structure: string[], material: string) => {
    const newBuildings: Building[] = [];
    const startX = centerX - Math.floor(structure[0].length / 2) * TILE_SIZE;
    const startY = centerY - Math.floor(structure.length / 2) * TILE_SIZE;

    structure.forEach((row, y) => {
        row.split('').forEach((char, x) => {
            if (char === '#') {
                const blockX = startX + x * TILE_SIZE;
                const blockY = startY + y * TILE_SIZE;
                newBuildings.push({
                    id: `struct_building_${blockX}_${blockY}`,
                    x: blockX, y: blockY, size: TILE_SIZE,
                    type: 'block', material: material, hp: BLOCK_HP[material], maxHp: BLOCK_HP[material]
                });
            } else if (char === 'D') {
                 const doorX = startX + x * TILE_SIZE;
                 const doorY = startY + y * TILE_SIZE;
                 newBuildings.push({
                     id: `struct_door_${doorX}_${doorY}`,
                     x: doorX, y: doorY, size: TILE_SIZE,
                     type: 'door', material: material, hp: BLOCK_HP[material], maxHp: BLOCK_HP[material], isOpen: false
                 });
            }
        });
    });
    return newBuildings;
  }, []);

  const initGame = useCallback(() => {
    const initialPlayer = createInitialPlayer();
    setPlayer(initialPlayer);
    setDay(1);
    setIsNight(false);
    setTimeInCycle(0);
    setZombies([]);
    setAnimals([]);
    setDogs([]);
    setItemDrops([]);
    setProjectiles([]);
    setPortals([]);
    setParticles([]);
    setExplosions([]);
    setCreativeMode(false);
    setInvisible(false);
    setNoclip(false);
    setBuildings([]);
    setIsBloodMoon(false);
    setIsRaining(false);
    
    // NPCs & Structures
    const newNPCs: NPC[] = [];
    const newBuildings: Building[] = [];

    // Vendor NPC + House
    const vendorHouseX = WORLD_WIDTH / 2 + 500;
    const vendorHouseY = WORLD_HEIGHT / 2 + 500;
    newNPCs.push({
        id: 'npc_vendor', x: vendorHouseX, y: vendorHouseY, size: PLAYER_SIZE,
        type: NPCType.VENDOR, name: 'Claudio' // Base name, will be translated in UI
    });
    const houseLayout = [
        '#######',
        '#     #',
        '#     #',
        '#     #',
        '###D###'
    ];
    newBuildings.push(...generateStructure(vendorHouseX, vendorHouseY, houseLayout, 'wood'));

    // Quest Giver
     const questGiverX = WORLD_WIDTH / 2 - 500;
     const questGiverY = WORLD_HEIGHT / 2 - 500;
     newNPCs.push({
        id: 'npc_quest', x: questGiverX, y: questGiverY, size: PLAYER_SIZE,
        type: NPCType.QUEST_GIVER, name: NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)]
     });

    setNpcs(newNPCs);
    setBuildings(newBuildings);

    generateResources('OVERWORLD');
    setDestroyedResources([]);
    setGameState(GameState.PLAYING);
  }, [generateResources, generateStructure]);

    const addToInventory = useCallback((itemToAdd: Item, quantity: number = itemToAdd.quantity): boolean => {
        if (itemToAdd.id === 'ammo') {
             setPlayer(p => ({ ...p, ammo: p.ammo + quantity}));
             return true;
        }
        if (itemToAdd.id === 'money') {
            setPlayer(p => ({...p, money: p.money + quantity}));
            return true;
        }

        let quantityLeft = quantity;
        let success = false;
        setPlayer(p => {
            const newInventory = p.inventory.map(slot => ({ ...slot, item: slot.item ? {...slot.item} : null }));
            
            if (itemToAdd.stackable) {
                for (let i = 0; i < newInventory.length; i++) {
                    const slot = newInventory[i];
                    if (slot.item && slot.item.id === itemToAdd.id && slot.item.quantity < slot.item.maxStack) {
                        const canAdd = slot.item.maxStack - slot.item.quantity;
                        const toAdd = Math.min(quantityLeft, canAdd);
                        newInventory[i] = { item: { ...slot.item, quantity: slot.item.quantity + toAdd } };
                        quantityLeft -= toAdd;
                        if (quantityLeft <= 0) break;
                    }
                }
            }
            
            if (quantityLeft > 0) {
                for (let i = 0; i < newInventory.length; i++) {
                    if (!newInventory[i].item) {
                        const toAdd = Math.min(quantityLeft, itemToAdd.maxStack);
                        const newItem = {...itemToAdd, quantity: toAdd};
                        if (newItem.maxDurability) {
                            newItem.durability = newItem.maxDurability;
                        }
                        newInventory[i] = { item: newItem };
                        quantityLeft -= toAdd;
                        if (quantityLeft <= 0) break;
                    }
                }
            }
            
            if (quantityLeft < quantity) {
                success = true;
                return { ...p, inventory: newInventory };
            }
            return p;
        });
        
        if (success) {
            playSound(SOUNDS.ITEM_PICKUP, { volume: 0.5 });
        }
        return success;
    }, []);
    
    const updatePlayerInventory = useCallback((
        newInventory: InventorySlot[],
        newEquipment: { weapon: Tool | null, armor: Armor | null, tool: Tool | null, offHand: InventorySlot },
        newCraftingGrid: InventorySlot[],
        newCraftingOutput: InventorySlot
    ) => {
        setPlayer(p => ({
            ...p,
            inventory: newInventory,
            weapon: newEquipment.weapon,
            armor: newEquipment.armor,
            tool: newEquipment.tool,
            offHand: newEquipment.offHand,
            craftingGrid: newCraftingGrid,
            craftingOutput: newCraftingOutput
        }));
    }, []);

    const updatePlayerAndPortalInventories = useCallback((newPlayerInventory: InventorySlot[], portalId: string, newPortalInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setPortals(ps => ps.map(p => p.id === portalId ? {...p, inventory: newPortalInventory} : p));
        setActivePortal(p => p ? {...p, inventory: newPortalInventory} : null);
    }, []);

    const updatePlayerAndChestInventories = useCallback((newPlayerInventory: InventorySlot[], chestId: string, newChestInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setBuildings(bs => bs.map(b => b.id === chestId ? {...b, inventory: newChestInventory} : b));
        setActiveChest(c => c ? {...c, inventory: newChestInventory} : null);
    }, []);
    
    const updatePlayerAndFurnaceInventories = useCallback((newPlayerInventory: InventorySlot[], furnaceId: string, newFurnaceInventory: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory}));
        setBuildings(bs => bs.map(b => b.id === furnaceId ? {...b, inventory: newFurnaceInventory} : b));
        setActiveFurnace(f => f ? {...f, inventory: newFurnaceInventory} : null);
    }, []);
    
    const updatePlayerAndEnchantingSlots = useCallback((newPlayerInventory: InventorySlot[], newEnchantingSlots: InventorySlot[]) => {
        setPlayer(p => ({...p, inventory: newPlayerInventory, enchantingSlots: newEnchantingSlots }));
    }, []);

    const handleNamePet = useCallback((dogId: string, name: string) => {
        setDogs(ds => ds.map(d => d.id === dogId ? { ...d, name } : d));
        setDogBeingNamed(null);
        setGameState(GameState.PLAYING);
    }, []);


  const checkCollision = (rect: {x:number, y:number, width:number, height:number}, objects: (Building|ResourceNode|Portal|NPC|Dog)[]) => {
      for(const obj of objects) {
          if ('type' in obj && obj.type === 'portal') continue; // Can walk through portals
          if ('state' in obj && obj.state === DogState.SITTING) { // Tamed dogs sitting are solid
            // dog collision logic
          }
          if (rect.x < obj.x + obj.size/2 &&
              rect.x + rect.width > obj.x - obj.size/2 &&
              rect.y < obj.y + obj.size/2 &&
              rect.y + rect.height > obj.y - obj.size/2) {
              return true;
          }
      }
      return false;
  }
  
  const handleCraft = useCallback((itemId: string) => {
    const recipe = CRAFTING_RECIPES[itemId];
    if (!recipe) return;
    const craftedItemBase = ITEMS[itemId];
    if (!craftedItemBase) return;

    let quantityCreated = 1;
    if (itemId === 'arrow') quantityCreated = 4;
    
    const craftedItem = {...craftedItemBase, quantity: quantityCreated};
     if (craftedItem.maxDurability) {
        craftedItem.durability = craftedItem.maxDurability;
    }

    if (itemId === 'ammo') {
        const hasResources = player.inventory.some(slot => slot.item?.id === 'gold_ingot' && slot.item.quantity >= 1);
        if(hasResources) {
            setPlayer(p => {
                const newInventory = [...p.inventory];
                let consumed = false;
                for(const slot of newInventory) {
                    if(slot.item?.id === 'gold_ingot') {
                        slot.item.quantity -= 1;
                        if(slot.item.quantity <= 0) slot.item = null;
                        consumed = true;
                        break;
                    }
                }
                return consumed ? { ...p, inventory: newInventory, ammo: p.ammo + 30 } : p;
            });
             playSound(SOUNDS.CRAFT_SUCCESS);
        }
        return;
    }


    setPlayer(p => {
        const currentInventory = p.inventory.map(slot => ({ ...slot, item: slot.item ? { ...slot.item } : null }));
        const resourceCounts: { [key: string]: number } = {};
        
        currentInventory.forEach(slot => {
            if (slot.item) {
                resourceCounts[slot.item.id] = (resourceCounts[slot.item.id] || 0) + slot.item.quantity;
            }
        });

        const hasResources = Object.entries(recipe).every(([resourceId, requiredAmount]) => 
            (resourceCounts[resourceId] || 0) >= requiredAmount
        );
        
        if (!hasResources) {
            console.log("Not enough resources!");
            return p;
        }

        // Consume resources
        Object.entries(recipe).forEach(([resourceId, requiredAmount]) => {
            let amountToConsume = requiredAmount;
            for (let i = 0; i < currentInventory.length; i++) {
                const slot = currentInventory[i];
                if (slot.item && slot.item.id === resourceId) {
                    const amountInSlot = slot.item.quantity;
                    if (amountInSlot > amountToConsume) {
                        slot.item.quantity -= amountToConsume;
                        amountToConsume = 0;
                    } else {
                        amountToConsume -= amountInSlot;
                        currentInventory[i].item = null;
                    }
                }
                if (amountToConsume === 0) break;
            }
        });
        
        // This part needs to be synchronous with the player state update
        const tempPlayerState = { ...p, inventory: currentInventory };
       
        let added = false;
        // Try to stack first
        let quantityLeft = craftedItem.quantity;

        for(let i = 0; i < tempPlayerState.inventory.length; i++) {
            const slot = tempPlayerState.inventory[i];
            if (slot.item && slot.item.id === craftedItem.id && slot.item.stackable && slot.item.quantity < craftedItem.maxStack) {
                const canAdd = craftedItem.maxStack - slot.item.quantity;
                const toAdd = Math.min(quantityLeft, canAdd);
                slot.item.quantity += toAdd;
                quantityLeft -= toAdd;
            }
            if (quantityLeft <= 0) {
                added = true;
                break;
            }
        }
        
        if(quantityLeft > 0) {
            // Find empty slot for crafted item
            for(let i = 0; i < tempPlayerState.inventory.length; i++){
                if(!tempPlayerState.inventory[i].item) {
                    tempPlayerState.inventory[i].item = { ...craftedItem, quantity: quantityLeft };
                    quantityLeft = 0;
                    added = true;
                    break;
                }
            }
        }
        
        if(added) {
            playSound(SOUNDS.CRAFT_SUCCESS);
            return tempPlayerState;
        } else {
             console.log("Inventory full, cannot craft!");
            return p; // Revert if no space
        }
    });
}, [player.inventory]);

const enterRubyDimension = useCallback(() => {
    playSound(SOUNDS.PORTAL_TRAVEL);
    // Clear entities from the current dimension
    setZombies([]);
    setAnimals([]);
    setDogs([]);
    setBuildings([]);
    setItemDrops([]);
    setParticles([]);
    setNpcs([]);

    // Generate Ruby dimension content
    generateResources('RUBY');
    
    // Create the return portal
    setPortals([{
        id: `portal_to_overworld_${Date.now()}`,
        x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, 
        size: TILE_SIZE * 3,
        sizeX: TILE_SIZE * 1.5,
        sizeY: TILE_SIZE * 3,
        type: 'portal',
        inventory: [], isActive: true, targetDimension: 'OVERWORLD'
    }]);

    // Update player state
    setPlayer(p => ({
        ...p,
        dimension: 'RUBY',
        overworldX: p.x,
        overworldY: p.y,
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2 + 100
    }));
    
    setGameState(GameState.PLAYING);
    setActivePortal(null);
}, [generateResources]);

const returnToOverworld = useCallback(() => {
    playSound(SOUNDS.PORTAL_TRAVEL);
    // Clear entities from the current dimension
    setZombies([]);
    setAnimals([]);
    setDogs([]);
    setBuildings([]);
    setItemDrops([]);
    setParticles([]);
    setNpcs([]);

    // Generate Overworld content
    generateResources('OVERWORLD');
    setPortals([]); // Portals will respawn naturally
    
    // Respawn NPCs
    initGame(); // HACK: Re-initializing is easier than saving/restoring overworld state

    // Update player state
    setPlayer(p => ({
        ...p,
        dimension: 'OVERWORLD',
        x: p.overworldX,
        y: p.overworldY
    }));

    setGameState(GameState.PLAYING);
}, [generateResources, initGame]);

const takeDamage = useCallback((damage: number, attacker?: Zombie) => {
    setPlayer(p => {
        if (creativeMode) return p;

        let damageLeft = damage;
        const newOffHand = { ...p.offHand, item: p.offHand.item ? { ...p.offHand.item } : null };
        let newArmor = p.armor ? { ...p.armor } : null;

        // Unbreaking on Shield
        if (newOffHand.item?.type === 'shield' && newOffHand.item.durability && newOffHand.item.durability > 0) {
            let durabilityLoss = 1;
            const unbreaking = newOffHand.item.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
            if (unbreaking && Math.random() > 1 / (unbreaking.level + 1)) {
                durabilityLoss = 0;
            }

            if (durabilityLoss > 0) {
                const shieldDamage = Math.min(damageLeft, newOffHand.item.durability);
                newOffHand.item.durability -= shieldDamage;
                damageLeft -= shieldDamage;
                playSound(SOUNDS.SHIELD_HIT);
                if (newOffHand.item.durability <= 0) {
                    newOffHand.item = null;
                    playSound(SOUNDS.ITEM_BREAK);
                }
            }
        }
        
        let damageReduction = newArmor?.defense || 0;
        const protection = newArmor?.enchantments?.find(e => e.type === Enchantment.PROTECTION);
        if (protection) {
            damageReduction += protection.level * 0.05;
        }
        const damageTaken = damageLeft * (1 - damageReduction);
        
        if (newArmor && damageTaken > 0 && newArmor.durability !== undefined) {
            let durabilityLoss = 1;
             const unbreaking = newArmor.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
            if (unbreaking && Math.random() > 1 / (unbreaking.level + 1)) {
                durabilityLoss = 0;
            }
            const thorns = newArmor.enchantments?.find(e => e.type === Enchantment.THORNS);
            if (thorns) {
                durabilityLoss += 2; // Thorns costs extra durability
                if (attacker) {
                    setZombies(zs => zs.map(z => z.id === attacker.id ? {...z, hp: z.hp - (thorns.level * 2)} : z));
                }
            }

            newArmor.durability -= durabilityLoss;
            if (newArmor.durability <= 0) {
                playSound(SOUNDS.ITEM_BREAK);
                newArmor = null;
            }
        }

        const prospectiveHp = p.hp - damageTaken;

        if (prospectiveHp <= 0 && newOffHand.item?.id === 'totem_ruby') {
            playSound(SOUNDS.PORTAL_ACTIVATE); // Reusing sound for totem effect
            
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                setParticles(ps => [...ps, {
                    id: `totem_particle_${Date.now()}_${Math.random()}`,
                    x: p.x, y: p.y, size: Math.random() * 4 + 2,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    lifespan: 1500, maxLifespan: 1500,
                    color: ['#FFD700', '#FFC0CB', '#E0115F'][Math.floor(Math.random() * 3)]
                }]);
            }
            
            return {
                ...p,
                hp: 20, // Restore health
                offHand: { item: null }, // Consume totem
                lastDamageTime: Date.now() + 2000, // 2s invulnerability
                armor: newArmor,
            };
        }

        const newPlayerHp = Math.max(0, prospectiveHp);
        let lastDamageTime = p.lastDamageTime;

        if (damageTaken > 0) {
          lastDamageTime = Date.now();
          if (newPlayerHp <= 0) {
              setGameState(GameState.GAME_OVER);
          } else {
              playSound(SOUNDS.PLAYER_HURT);
          }
        }

        return { ...p, hp: newPlayerHp, lastDamageTime, offHand: newOffHand, armor: newArmor };
    });
}, [creativeMode]);

const handleExplosion = useCallback((x: number, y: number, radius: number, damage: number, isTntPlayerLaunch: boolean) => {
    playSound(SOUNDS.EXPLOSION);
    // 1. Add visual crater
    setExplosions(exps => [...exps, { id: `exp_${Date.now()}`, x, y, radius, createdAt: Date.now() }]);

    // 2. Player damage/launch
    const playerDist = Math.hypot(player.x - x, player.y - y);
    if (playerDist < radius && !creativeMode) {
        if (isTntPlayerLaunch && playerDist < TILE_SIZE * 1.5) {
            setPlayer(p => {
                 const angle = Math.atan2(p.y - y, p.x - x) || 1; // Avoid angle 0 if directly on top
                 const launchForce = PLAYER_LAUNCH_FORCE;
                 playSound(SOUNDS.PLAYER_HURT);
                 return {
                    ...p,
                    hp: 1,
                    vx: p.vx + Math.cos(angle) * launchForce,
                    vy: p.vy + Math.sin(angle) * launchForce,
                    lastDamageTime: Date.now(),
                 };
            });
        } else {
             const damageTaken = Math.floor(damage * (1 - playerDist / radius));
             takeDamage(damageTaken);
        }
    }

    // 3. Entity damage & drops
    const newDrops: ItemDrop[] = [];
    setZombies(zs => zs.map(z => {
        const dist = Math.hypot(z.x - x, z.y - y);
        if (dist < radius) {
            const damageTaken = (z.isBoss) ? 0 : Math.floor(damage * (1 - dist / radius));
            return {...z, hp: z.hp - damageTaken};
        }
        return z;
    }).filter(z => z.hp > 0));

    setAnimals(as => as.map(a => {
        const dist = Math.hypot(a.x - x, a.y - y);
        if (dist < radius) {
            return {...a, hp: a.hp - BAZOOKA_DAMAGE};
        }
        return a;
    }).filter(a => a.hp > 0));

    setDogs(ds => ds.map(d => {
         const dist = Math.hypot(d.x - x, d.y - y);
        if (dist < radius) {
            return {...d, hp: d.hp - BAZOOKA_DAMAGE};
        }
        return d;
    }).filter(d => d.hp > 0));


    // 4. Building/Resource destruction
    setBuildings(bs => bs.filter(b => {
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist < radius) {
            if(ITEMS[b.type]) {
                newDrops.push({ id: `drop_b_${b.type}_${Date.now()}`, x: b.x, y: b.y, size: 20, item: ITEMS[b.type as 'chest'] });
            }
            return false;
        }
        return true;
    }));
    setResources(rs => rs.filter(r => {
        const dist = Math.hypot(r.x - x, r.y - y);
        if (dist < radius) {
            const dropId = r.type === ResourceType.IRON ? 'iron_ore' : r.type === ResourceType.GOLD ? 'gold_ore' : r.type.toLowerCase();
            newDrops.push({ id: `drop_r_${r.type}_${Date.now()}`, x: r.x, y: r.y, size: 20, item: ITEMS[dropId] });
            return false;
        }
        return true;
    }));

    if (newDrops.length > 0) {
        setItemDrops(d => [...d, ...newDrops]);
    }
}, [player.x, player.y, takeDamage, creativeMode]);


  const gameTick = useCallback((dt: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    const speedMultiplier = dt / (1000 / 60); // Normalize speed to 60 FPS baseline

    // Time and Day/Night cycle
    if(player.dimension === 'OVERWORLD') {
        setTimeInCycle(prev => {
            const newTime = prev + dt;
            const cycleDuration = isNight ? (isBloodMoon ? BLOOD_MOON_DURATION_MS : NIGHT_DURATION_MS) : DAY_DURATION_MS;
            if (newTime >= cycleDuration) {
                if (isNight) {
                    setDay(d => d + 1);
                    setIsNight(false);
                    setIsBloodMoon(false);
                    setZombies(zs => zs.filter(z => z.isBoss)); // Zombies despawn in the morning
                     if(Math.random() < 0.2 && !isRaining) { // 20% chance of rain
                        setIsRaining(true);
                        setRainTimer(RAIN_DURATION_MS);
                    }
                } else {
                    setIsNight(true);
                    setAnimals([]); // Animals despawn at night
                    if ((day + 1) % 10 === 0) { // Blood moon every 10 days
                        setIsBloodMoon(true);
                    }
                    // Drain energy for not sleeping
                    setPlayer(p => ({...p, energy: Math.max(0, p.energy - 30)}));
                }
                return 0;
            }
            return newTime;
        });
    }
    
    // Rain timer
    if(isRaining) {
        setRainTimer(t => {
            const newT = t - dt;
            if(newT <= 0) {
                setIsRaining(false);
                return 0;
            }
            return newT;
        });
    }

    // Explosion crater cleanup
    setExplosions(exps => exps.filter(exp => Date.now() - exp.createdAt < CRATER_DURATION_MS));

    // Mending Enchantment
    const checkMending = (item: Item | null, slotKey: string) => {
        if (item && item.durability !== undefined && item.maxDurability && item.durability < item.maxDurability) {
            const mending = item.enchantments?.find(e => e.type === Enchantment.MENDING);
            if (mending) {
                const timerId = `${slotKey}-${item.id}`;
                mendingTimers[timerId] = (mendingTimers[timerId] || 0) + dt;
                if (mendingTimers[timerId] >= 1000) { // Repair 1 durability per second
                    item.durability = Math.min(item.maxDurability, item.durability + 1);
                    mendingTimers[timerId] = 0;
                }
                return { ...item };
            }
        }
        return item;
    }

    setPlayer(p => {
        let needsUpdate = false;
        const newWeapon = checkMending(p.weapon, 'weapon');
        const newArmor = checkMending(p.armor, 'armor');
        const newTool = checkMending(p.tool, 'tool');
        const newOffHandItem = checkMending(p.offHand.item, 'offhand');

        if (newWeapon !== p.weapon || newArmor !== p.armor || newTool !== p.tool || newOffHandItem !== p.offHand.item) {
            needsUpdate = true;
        }

        if(needsUpdate) {
            return {
                ...p,
                weapon: newWeapon as Tool | null,
                armor: newArmor as Armor | null,
                tool: newTool as Tool | null,
                offHand: { item: newOffHandItem }
            };
        }
        return p;
    });

    // Resource Respawning
    setDestroyedResources(prev => {
        const stillRespawning: ResourceNode[] = [];
        const newlyRespawned: ResourceNode[] = [];
        prev.forEach(res => {
            res.respawnTimer -= dt;
            if (res.respawnTimer <= 0) {
                newlyRespawned.push({ ...res, hp: res.maxHp, respawnTimer: 0 });
            } else {
                stillRespawning.push(res);
            }
        });
        if (newlyRespawned.length > 0) {
            setResources(r => [...r, ...newlyRespawned]);
        }
        return stillRespawning;
    });
    
    // Portal Spawning
    if (player.dimension === 'OVERWORLD' && portals.length === 0) {
         const x = WORLD_WIDTH / 2;
         const y = WORLD_HEIGHT / 2 - 200;
         setPortals(ps => [...ps, {
             id: `portal_to_ruby_${Date.now()}`,
             x,
             y,
             size: TILE_SIZE * 3,
             sizeX: TILE_SIZE * 1.5,
             sizeY: TILE_SIZE * 3,
             type: 'portal',
             inventory: Array.from({ length: PORTAL_INVENTORY_SLOTS }, () => ({ item: null })),
             isActive: false, 
             targetDimension: 'RUBY'
         }]);
    }

    // Particle System (Ruby Dimension only)
    if (player.dimension === 'RUBY') {
        // Spawn new particles
        if (Math.random() < 0.5) { // Spawn rate
            const particleCamera = {
                x: player.x - window.innerWidth / 2,
                y: player.y - window.innerHeight / 2
            };
            const spawnX = particleCamera.x + Math.random() * window.innerWidth;
            const spawnY = particleCamera.y + Math.random() * window.innerHeight;
            const lifespan = Math.random() * 3000 + 2000; // 2-5 seconds
            const size = Math.random() * 3 + 1; // 1-4 pixels
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.5 + 0.1;
            
            setParticles(ps => [
                ...ps,
                {
                    id: `particle_${Date.now()}_${Math.random()}`,
                    x: spawnX,
                    y: spawnY,
                    size,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    lifespan,
                    maxLifespan: lifespan,
                    color: ['#E0115F', '#DC143C', '#FFC0CB'][Math.floor(Math.random() * 3)],
                }
            ]);
        }
    }
    
    // Update particles
    setParticles(ps => ps.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        lifespan: p.lifespan - dt,
    })).filter(p => p.lifespan > 0));


    // Check for return portal proximity
    if (player.dimension === 'RUBY') {
        const returnPortal = portals.find(p => p.targetDimension === 'OVERWORLD');
        if (returnPortal) {
            const portalWidth = returnPortal.sizeX || returnPortal.size;
            const portalHeight = returnPortal.sizeY || returnPortal.size;
            const isNear = player.x > returnPortal.x - portalWidth / 2 &&
                           player.x < returnPortal.x + portalWidth / 2 &&
                           player.y > returnPortal.y - portalHeight / 2 &&
                           player.y < returnPortal.y + portalHeight / 2;
            setIsNearReturnPortal(isNear);
        } else {
            setIsNearReturnPortal(false);
        }
    } else {
         setIsNearReturnPortal(false);
    }


    // Zombie Spawning
    if (player.dimension === 'RUBY' && !creativeMode) {
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            const stats = ZOMBIE_STATS.RUBY;
             setZombies(zs => [...zs, {
                id: `zombie_ruby_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
                type: ZombieType.RUBY, targetId: 1, isBoss: false, attackCooldown: 1000, lastAttackTime: 0,
                state: ZombieState.PURSUING, targetX: x, targetY: y, stateTimer: 0,
            }]);
             playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.3 });
        }
    }
    else if (isNight && !creativeMode && player.dimension === 'OVERWORLD') {
        const spawnMultiplier = isBloodMoon ? 5 : 1;
        if (Math.random() < (0.02 * (1 + day / 10)) * spawnMultiplier) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            const biome = getBiomeAt(x, y);
            if (biome === Biome.WATER) return;

            let type: ZombieType = ZombieType.NORMAL;

            switch(biome) {
                case Biome.DESERT: type = ZombieType.DESERT; break;
                case Biome.SNOW: type = ZombieType.SNOW; break;
                case Biome.FOREST: type = ZombieType.FOREST; break;
                case Biome.LAVA: type = ZombieType.LAVA; break;
                case Biome.PLAINS: type = ZombieType.NORMAL; break;
            }

            const rand = Math.random();
             if (biome !== Biome.LAVA) { // No giants/immortals in lava caves
                if (rand > 1 - (ZOMBIE_STATS.IMMORTAL.spawnChance || 0)) {
                    type = ZombieType.IMMORTAL;
                } else if (rand > 1 - ((ZOMBIE_STATS.IMMORTAL.spawnChance || 0) + (ZOMBIE_STATS.GIANT.spawnChance || 0))) {
                    type = ZombieType.GIANT;
                }
            }

            const stats = ZOMBIE_STATS[ZombieType[type] as keyof typeof ZOMBIE_STATS];
            
            setZombies(zs => [...zs, {
                id: `zombie_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
                type, targetId: null, isBoss: false, attackCooldown: 1000, lastAttackTime: 0,
                state: ZombieState.WANDERING, targetX: x, targetY: y, stateTimer: 0,
            }]);
            playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.3 });
        }
    }
     // Day 100 Boss
    if (day === 100 && player.dimension === 'OVERWORLD' && !creativeMode && !zombies.some(z => z.isBoss)) {
        const stats = ZOMBIE_STATS.BOSS;
        setZombies(zs => [...zs, {
            id: `zombie_boss_${Date.now()}`, x: player.x + 800, y: player.y, size: stats.size,
            hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
            type: ZombieType.BOSS, targetId: 1, isBoss: true, attackCooldown: 2000, lastAttackTime: 0,
            state: ZombieState.PURSUING, targetX: player.x, targetY: player.y, stateTimer: 0
        }]);
         playSound(SOUNDS.ZOMBIE_GROAN, { volume: 0.8 });
    }

    // Animal Spawning
    if (!isNight && !isBloodMoon && animals.length < 20 && player.dimension === 'OVERWORLD') {
        if (Math.random() < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 500;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            
            if (getBiomeAt(x, y) === Biome.LAVA) return;

            const rand = Math.random();
            let type: AnimalType;
            if (rand < 0.3) type = AnimalType.PIG;
            else if (rand < 0.6) type = AnimalType.SHEEP;
            else if (rand < 0.85) type = AnimalType.CHICKEN;
            else type = AnimalType.COW;
            
            const stats = ANIMAL_STATS[AnimalType[type] as keyof typeof ANIMAL_STATS];
            
            setAnimals(as => [...as, {
                id: `animal_${Date.now()}_${Math.random()}`, x, y, size: stats.size,
                hp: stats.hp, speed: stats.speed, type, vx: 0, vy: 0, changeDirectionTimer: 0,
            }]);
        }
    }

    // Dog Spawning
    if (dogs.filter(d => d.state === DogState.WILD).length < 5 && player.dimension === 'OVERWORLD') {
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const distance = window.innerWidth / 2 + Math.random() * 800;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            if (getBiomeAt(x, y) === Biome.FOREST) {
                 setDogs(ds => [...ds, {
                    id: `dog_${Date.now()}_${Math.random()}`, x, y,
                    size: DOG_STATS.size, hp: DOG_STATS.hp, maxHp: DOG_STATS.hp,
                    speed: DOG_STATS.speed / 2, // Slower when wild
                    state: DogState.WILD, name: null, ownerId: null,
                    vx: 0, vy: 0, stateTimer: 0, targetId: null, lastAttackTime: 0
                 }]);
            }
        }
    }


    // Update Player
    setPlayer(p => {
        let newX = p.x;
        let newY = p.y;
        let newHp = p.hp;
        let newSlowEffect = p.slowEffect;

        // Apply velocity from explosions
        newX += p.vx * speedMultiplier;
        newY += p.vy * speedMultiplier;
        // Apply friction
        let newVx = p.vx * 0.95;
        let newVy = p.vy * 0.95;
        if (Math.abs(newVx) < 0.1) newVx = 0;
        if (Math.abs(newVy) < 0.1) newVy = 0;


        if (newSlowEffect && Date.now() > newSlowEffect.endTime) {
            newSlowEffect = undefined;
        }

        // Health Regeneration
        if (!creativeMode && Date.now() - p.lastDamageTime > 10000 && p.hp < p.maxHp) {
            newHp = Math.min(p.maxHp, p.hp + (10 / 10000) * dt); // 10 HP per 10 seconds
        }
        
        const isSprinting = keysPressed['shift'] && p.stamina > 0 && p.energy > 0;
        let currentSpeed = (isSprinting || (creativeMode && noclip)) ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
        
        if (newSlowEffect) {
            currentSpeed *= newSlowEffect.factor;
        }

        const playerBiome = getBiomeAt(p.x, p.y, p.dimension);
        if (playerBiome !== currentBiome) {
            setCurrentBiome(playerBiome);
        }

        if (playerBiome === Biome.WATER) {
            currentSpeed *= 0.5; // Slow down in water
        }

        let stamina = p.stamina;
        let energy = p.energy;
        let moved = false;
        
        const moveAmount = currentSpeed * speedMultiplier;
        if (keysPressed['w']) { newY -= moveAmount; moved = true; }
        if (keysPressed['s']) { newY += moveAmount; moved = true; }
        if (keysPressed['a']) { newX -= moveAmount; moved = true; }
        if (keysPressed['d']) { newX += moveAmount; moved = true; }

        // Footstep sounds
        if (moved) {
            const now = Date.now();
            if (now - lastFootstepTime.current > (p.sprinting ? 350 : 500)) {
                lastFootstepTime.current = now;
                let footstepSound = SOUNDS.PLAYER_FOOTSTEP_GRASS;
                switch (playerBiome) {
                    case Biome.WATER: footstepSound = SOUNDS.PLAYER_SWIM; break;
                    case Biome.DESERT: footstepSound = SOUNDS.PLAYER_FOOTSTEP_SAND; break;
                    case Biome.SNOW: footstepSound = SOUNDS.PLAYER_FOOTSTEP_SNOW; break;
                    // FIX: Replaced non-existent Biome.STONE with Biome.RUBY for correct footstep sounds.
                    case Biome.RUBY: case Biome.LAVA: footstepSound = SOUNDS.PLAYER_FOOTSTEP_STONE; break;
                }
                playSound(footstepSound, { volume: 0.3 });
            }
        }


        let lavaDamageTimer = p.lavaDamageTimer;
        let lastDamageTime = p.lastDamageTime;
        if (playerBiome === Biome.LAVA && !creativeMode) {
            lavaDamageTimer += dt;
            if (lavaDamageTimer > LAVA_DAMAGE_THRESHOLD_MS) {
                newHp = Math.max(0, newHp - (LAVA_DAMAGE_PER_SECOND * (dt / 1000)));
                lastDamageTime = Date.now();
                 if (newHp <= 0) {
                    setGameState(GameState.GAME_OVER);
                 } else {
                     playSound(SOUNDS.PLAYER_HURT, { volume: 0.5 });
                 }
            }
        } else {
            lavaDamageTimer = 0;
        }

        let lastEnergyDamageTime = p.lastEnergyDamageTime;
        if (creativeMode) {
            stamina = PLAYER_MAX_STAMINA;
            energy = PLAYER_MAX_ENERGY;
        } else {
            if (isSprinting && moved) {
                stamina = Math.max(0, stamina - STAMINA_DRAIN_RATE * speedMultiplier);
                energy = Math.max(0, energy - ENERGY_DRAIN_RATE * speedMultiplier);
            } else {
                stamina = Math.min(PLAYER_MAX_STAMINA, stamina + STAMINA_REGEN_RATE * speedMultiplier);
            }

            if (energy <= 0 && Date.now() - lastEnergyDamageTime > 2000) {
                takeDamage(ENERGY_DAMAGE_AMOUNT);
                lastEnergyDamageTime = Date.now();
            }
        }
        
        if (!noclip) {
            const solidBuildings = buildings.filter(b => !b.isOpen);
            const solidDogs = dogs.filter(d => d.state === DogState.SITTING);
            const collisionObjects = [...solidBuildings, ...resources, ...portals, ...npcs, ...solidDogs];
            let playerRect = { x: newX - p.size/2, y: p.y - p.size/2, width: p.size, height: p.size };
            if (checkCollision(playerRect, collisionObjects)) {
                newX = p.x + p.vx * speedMultiplier; // Keep knockback movement if primary movement is blocked
                newVx = 0; // Stop velocity on collision
            }
            
            playerRect = { x: p.x - p.size/2, y: newY - p.size/2, width: p.size, height: p.size };
             if (checkCollision(playerRect, collisionObjects)) {
                newY = p.y + p.vy * speedMultiplier; // Keep knockback movement
                newVy = 0; // Stop velocity on collision
            }
        }
        
        // Check Item Drop Collision
        setItemDrops(drops => {
            const remainingDrops = [];
            for (const drop of drops) {
                const dist = Math.hypot(newX - drop.x, newY - drop.y);
                if (dist < p.size / 2 + drop.size / 2) {
                    addToInventory(drop.item);
                } else {
                    remainingDrops.push(drop);
                }
            }
            return remainingDrops;
        });
        
        return { ...p, x: Math.max(0, Math.min(WORLD_WIDTH, newX)), y: Math.max(0, Math.min(WORLD_HEIGHT, newY)), sprinting: isSprinting, stamina, energy, lavaDamageTimer, hp: newHp, lastDamageTime, lastEnergyDamageTime, slowEffect: newSlowEffect, vx: newVx, vy: newVy };
    });

    // Update Zombies
    const solidBuildings = buildings.filter(b => !b.isOpen);
    setZombies(zs => {
        const newDrops: ItemDrop[] = [];
        const updatedZombies = zs.map(zombie => {
            if (creativeMode && invisible) return zombie;

            let { x, y, lastAttackTime, shieldActive, state, targetX, targetY, stateTimer, hp } = zombie;

            // State Machine Logic
            const distToPlayer = Math.hypot(player.x - x, player.y - y);

            switch (state) {
                case ZombieState.WANDERING:
                    if (distToPlayer < ZOMBIE_DETECTION_RADIUS) {
                        state = ZombieState.PURSUING;
                    } else {
                        const distToTarget = Math.hypot(targetX - x, targetY - y);
                        if (distToTarget < TILE_SIZE || stateTimer <= 0) {
                            targetX = x + (Math.random() - 0.5) * 500;
                            targetY = y + (Math.random() - 0.5) * 500;
                            stateTimer = Math.random() * 5000 + 3000;
                        }
                    }
                    break;

                case ZombieState.PURSUING:
                    targetX = player.x;
                    targetY = player.y;
                    if (distToPlayer > ZOMBIE_DETECTION_RADIUS * 1.5) { // Lose interest
                        state = ZombieState.WANDERING;
                        stateTimer = 0;
                    }
                    break;

                case ZombieState.INVESTIGATING:
                    const distToInvestigationTarget = Math.hypot(targetX - x, targetY - y);
                     if (distToPlayer < ZOMBIE_DETECTION_RADIUS) {
                        state = ZombieState.PURSUING;
                    } else if (distToInvestigationTarget < TILE_SIZE) {
                        if (stateTimer <= 0) stateTimer = 3000; // Wait for 3 seconds
                        stateTimer -= dt;
                        if (stateTimer <= 0) {
                            state = ZombieState.WANDERING;
                        }
                    }
                    break;
            }

            // Movement Logic
            if (state !== ZombieState.WANDERING || (state === ZombieState.WANDERING && stateTimer > 0)) {
                stateTimer -= dt;

                const dx = targetX - x;
                const dy = targetY - y;
                const distToTarget = Math.hypot(dx, dy);
                
                if (distToTarget > zombie.size / 2) {
                    const moveAmount = zombie.speed * speedMultiplier;
                    const nextX = x + (dx / distToTarget) * moveAmount;
                    const nextY = y + (dy / distToTarget) * moveAmount;
                    
                    let isBlocked = false;
                    let blockingBuilding: Building | null = null;
                     for (const building of solidBuildings) {
                        const buildingDist = Math.hypot(nextX - building.x, nextY - building.y);
                        if (buildingDist < zombie.size / 2 + building.size / 2) {
                            isBlocked = true;
                            blockingBuilding = building;
                            break;
                        }
                    }

                    if (isBlocked && blockingBuilding) {
                        if (Date.now() - lastAttackTime > zombie.attackCooldown) {
                            lastAttackTime = Date.now();
                            playSound(SOUNDS.ZOMBIE_ATTACK, { volume: 0.4 });
                            setBuildings(bs => bs.map(b => 
                                b.id === blockingBuilding?.id ? {...b, hp: b.hp - zombie.damage} : b
                            ).filter(b => b.hp > 0));
                        }
                    } else {
                        x = nextX;
                        y = nextY;
                    }
                }
            }
            
            // Player Attack Logic
            if (distToPlayer < zombie.size / 2 + player.size / 2 && Date.now() - lastAttackTime > zombie.attackCooldown) {
                lastAttackTime = Date.now();
                playSound(SOUNDS.ZOMBIE_ATTACK, { volume: 0.6 });
                
                if (zombie.type === ZombieType.SNOW) {
                    const snowZombieStats = ZOMBIE_STATS.SNOW;
                    if (snowZombieStats.slowAttack) {
                        setPlayer(p => ({...p, slowEffect: {
                            endTime: Date.now() + snowZombieStats.slowAttack.duration,
                            factor: snowZombieStats.slowAttack.factor,
                        }}));
                    }
                }
                takeDamage(zombie.damage, zombie);
            }

            // Boss Shield Logic
            if (zombie.isBoss) {
                shieldActive = hp <= 500 && hp > 50;
            }
            
            return { ...zombie, x, y, hp, lastAttackTime, shieldActive, state, targetX, targetY, stateTimer };

        }).filter(zombie => {
            if (zombie.hp <= 0) {
                if (zombie.isBoss) {
                    playSound(SOUNDS.BOSS_DEATH);
                    newDrops.push({id: `drop_totem_${Date.now()}`, x: zombie.x, y: zombie.y, size: 20, item: {...ITEMS.totem_ruby}});
                } else {
                    playSound(SOUNDS.ZOMBIE_DEATH);
                    const looting = player.weapon?.enchantments?.find(e => e.type === Enchantment.LOOTING);
                    if (looting && Math.random() < looting.level * 0.25) { // 25% chance per level for extra drop
                        newDrops.push({id: `drop_money_${Date.now()}`, x: zombie.x, y: zombie.y, size: 10, item: {...ITEMS.money, quantity: Math.ceil(Math.random() * 5)}});
                    }
                }
                return false;
            }
            return true;
        });

        if (newDrops.length > 0) {
            setItemDrops(d => [...d, ...newDrops]);
        }
        return updatedZombies;
    });

    // Update Animals
    setAnimals(as => as.map(animal => {
        let { x, y, vx, vy, changeDirectionTimer } = animal;
        
        changeDirectionTimer -= dt;
        if(changeDirectionTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            vx = Math.cos(angle) * animal.speed;
            vy = Math.sin(angle) * animal.speed;
            changeDirectionTimer = Math.random() * 3000 + 2000;
             if (Math.random() < 0.1) {
                if (animal.type === AnimalType.PIG) playSound(SOUNDS.ANIMAL_PIG, { volume: 0.2 });
                if (animal.type === AnimalType.COW) playSound(SOUNDS.ANIMAL_COW, { volume: 0.2 });
                if (animal.type === AnimalType.SHEEP) playSound(SOUNDS.ANIMAL_SHEEP, { volume: 0.2 });
            }
        }

        const moveAmount = speedMultiplier;
        let nextX = x + vx * moveAmount;
        let nextY = y + vy * moveAmount;

        const nextBiome = getBiomeAt(nextX, nextY);
        if (nextBiome === Biome.LAVA) { // Animals avoid lava
             vx *= -1;
             vy *= -1;
             nextX = x + vx * moveAmount;
             nextY = y + vy * moveAmount;
        }

        x = nextX;
        y = nextY;
        
        // Basic world bounds collision
        if(x < 0 || x > WORLD_WIDTH) vx *= -1;
        if(y < 0 || y > WORLD_HEIGHT) vy *= -1;

        return { ...animal, x, y, vx, vy, changeDirectionTimer };
    }).filter(a => a.hp > 0));

     // Update Dogs
    setDogs(ds => {
        return ds.map(dog => {
            let { x, y, vx, vy, state, stateTimer, targetId, hp, lastAttackTime } = dog;

            switch (state) {
                case DogState.WILD:
                case DogState.HOSTILE:
                    stateTimer -= dt;
                    if (stateTimer <= 0) {
                        const angle = Math.random() * Math.PI * 2;
                        vx = Math.cos(angle) * dog.speed;
                        vy = Math.sin(angle) * dog.speed;
                        stateTimer = Math.random() * 3000 + 2000;
                    }
                    if (state === DogState.HOSTILE) {
                         const dist = Math.hypot(player.x - x, player.y - y);
                        if(dist < dog.size/2 + player.size/2 && Date.now() - lastAttackTime > DOG_STATS.attackCooldown){
                            lastAttackTime = Date.now();
                            takeDamage(DOG_STATS.damage / 2); // Hostile dogs do less damage
                        } else if (dist > dog.size / 2) {
                            const dx = player.x - x;
                            const dy = player.y - y;
                            vx = (dx / dist) * dog.speed;
                            vy = (dy / dist) * dog.speed;
                        }
                    }
                    break;
                case DogState.FOLLOWING:
                    const distToOwner = Math.hypot(player.x - x, player.y - y);
                    if (distToOwner > TILE_SIZE) {
                        const angle = Math.atan2(player.y - y, player.x - x);
                        vx = Math.cos(angle) * DOG_STATS.speed;
                        vy = Math.sin(angle) * DOG_STATS.speed;
                    } else {
                        vx = 0; vy = 0;
                    }
                    break;
                case DogState.SITTING:
                    vx = 0; vy = 0;
                    break;
                case DogState.ATTACKING:
                    const target = zombies.find(z => z.id === targetId) || animals.find(a => a.id === targetId);
                    if (target) {
                        const distToTarget = Math.hypot(target.x - x, target.y - y);
                        if (distToTarget < dog.size/2 + target.size/2) {
                            vx = 0; vy = 0;
                            if (Date.now() - lastAttackTime > DOG_STATS.attackCooldown) {
                                lastAttackTime = Date.now();
                                playSound(SOUNDS.DOG_ATTACK, { volume: 0.5 });
                                if ('type' in target && 'isBoss' in target) { // it's a zombie
                                    setZombies(zs => zs.map(z => z.id === target.id ? {...z, hp: z.hp - DOG_STATS.damage} : z));
                                } else { // it's an animal
                                     setAnimals(as => as.map(a => a.id === target.id ? {...a, hp: a.hp - DOG_STATS.damage} : a));
                                }
                            }
                        } else {
                            const angle = Math.atan2(target.y - y, target.x - x);
                            vx = Math.cos(angle) * DOG_STATS.speed * 1.2; // Faster when attacking
                            vy = Math.sin(angle) * DOG_STATS.speed * 1.2;
                        }
                    } else {
                        state = DogState.FOLLOWING; // Target died or disappeared
                    }
                    break;
            }

            const moveAmount = speedMultiplier;
            let nextX = x + vx * moveAmount;
            let nextY = y + vy * moveAmount;
            
            let currentSpeed = 1;
            if (getBiomeAt(nextX, nextY) === Biome.WATER) {
                currentSpeed = 0.5;
            }
            
            nextX = x + vx * moveAmount * currentSpeed;
            nextY = y + vy * moveAmount * currentSpeed;

            x = nextX;
            y = nextY;


            return { ...dog, x, y, vx, vy, state, stateTimer, hp, lastAttackTime };
        }).filter(d => d.hp > 0);
    });

    // Update Projectiles & Check Hits
    setProjectiles(projs => {
        const activeProjectiles: Projectile[] = [];
        for (const proj of projs) {
            let {x, y, vx, vy, lifespan, homingTargetId} = proj;

            if (homingTargetId) {
                const target = zombies.find(z => z.id === homingTargetId);
                if (target && target.hp > 0) {
                    const angle = Math.atan2(target.y - y, target.x - x);
                    const projectileSpeed = Math.hypot(vx, vy);
                    vx = Math.cos(angle) * projectileSpeed;
                    vy = Math.sin(angle) * projectileSpeed;
                } else {
                    homingTargetId = undefined; // Target is dead or gone
                }
            }

            const moveAmount = speedMultiplier;
            const newProj = { ...proj, x: x + vx * moveAmount, y: y + vy * moveAmount, lifespan: lifespan - dt, vx, vy, homingTargetId };
            if (newProj.lifespan <= 0) continue;

            let hit = false;
            
            const checkHit = (target: Zombie | Animal | Dog) => {
                 const dist = Math.hypot(newProj.x - target.x, newProj.y - target.y);
                 return dist < newProj.size / 2 + target.size / 2;
            }

            if (proj.owner === 'player') {
                const targets: (Zombie | Animal | Dog)[] = [...zombies, ...animals, ...dogs.filter(d => d.ownerId !== player.id)];
                 for (const target of targets) {
                     if (checkHit(target)) {
                         hit = true;
                         if (proj.isRocket) {
                             handleExplosion(newProj.x, newProj.y, BAZOOKA_RADIUS, BAZOOKA_DAMAGE, false);
                         } else {
                              if ('isBoss' in target) { // Zombie
                                 if (target.isBoss && target.shieldActive) {
                                     playSound(SOUNDS.SHIELD_HIT);
                                 } else {
                                     playSound(SOUNDS.ZOMBIE_HURT, { volume: 0.6 });
                                     setZombies(zs => zs.map(z => z.id === target.id ? {...z, hp: z.hp - proj.damage} : z));
                                 }
                             } else if ('changeDirectionTimer' in target) { // Animal
                                 setAnimals(as => as.map(a => a.id === target.id ? {...a, hp: a.hp - proj.damage} : a));
                             } else { // Dog
                                 setDogs(ds => ds.map(d => d.id === target.id ? {...d, hp: d.hp - proj.damage, state: DogState.HOSTILE} : d));
                             }
                         }
                         break;
                     }
                 }
            }
            
            // Check projectile collision with environment
            const solidObjects: (Building | ResourceNode)[] = [...buildings, ...resources];
            for (const obj of solidObjects) {
                if (hit) break;
                const dist = Math.hypot(newProj.x - obj.x, newProj.y - obj.y);
                if (dist < newProj.size / 2 + obj.size / 2) {
                    hit = true;
                    if (proj.isRocket) {
                        handleExplosion(newProj.x, newProj.y, BAZOOKA_RADIUS, BAZOOKA_DAMAGE, false);
                    }
                }
            }

            if (!hit) {
                activeProjectiles.push(newProj);
            }
        }
        return activeProjectiles;
    });

    // Update Furnaces
    setBuildings(bs => {
        return bs.map(b => {
            if (b.type !== 'furnace' || !b.inventory) return b;

            const newFurnace = {...b, inventory: b.inventory.map(s => ({...s, item: s.item ? {...s.item} : null}))};
            const inputSlot = newFurnace.inventory[0];
            const fuelSlot = newFurnace.inventory[1];
            const outputSlot = newFurnace.inventory[2];

            const canSmelt = inputSlot.item?.smeltResult &&
                             (!outputSlot.item || (outputSlot.item.id === inputSlot.item.smeltResult && outputSlot.item.quantity < outputSlot.item.maxStack));

            if (newFurnace.fuelLeft && newFurnace.fuelLeft > 0) {
                if (canSmelt) {
                    newFurnace.fuelLeft -= dt;
                    newFurnace.smeltProgress = (newFurnace.smeltProgress || 0) + dt;

                    if (newFurnace.smeltProgress >= SMELT_TIME) {
                        newFurnace.smeltProgress = 0;
                        const resultId = inputSlot.item!.smeltResult!;
                        if(outputSlot.item) {
                            outputSlot.item.quantity++;
                        } else {
                            outputSlot.item = {...ITEMS[resultId], quantity: 1};
                        }
                        inputSlot.item!.quantity--;
                        if (inputSlot.item!.quantity <= 0) {
                            inputSlot.item = null;
                        }
                         playSound(SOUNDS.FURNACE_POP);
                    }
                } else {
                    newFurnace.smeltProgress = 0; // Stop smelting if cannot output
                }
            } else if (canSmelt && fuelSlot.item?.fuelTime) {
                // Consume fuel
                newFurnace.fuelLeft = fuelSlot.item.fuelTime;
                fuelSlot.item.quantity--;
                if (fuelSlot.item.quantity <= 0) {
                    fuelSlot.item = null;
                }
            } else {
                newFurnace.smeltProgress = 0; // No fuel, stop smelting
            }
            
            return newFurnace;
        });
    });
    
    // FIX: Refactored interaction logic to fix a 'never' type error and incorrect control flow.
    // The previous structure had an unreachable 'else' block. The new structure correctly
    // distinguishes between instant actions and hold-to-interact actions.
    if (keysPressed['e']) {
        let closestInteractable: ResourceNode | Building | Portal | NPC | Dog | null = null;
        let minDistance = 100;

        const interactables: (ResourceNode | Building | Portal | NPC | Dog)[] = [...resources, ...buildings, ...portals, ...npcs, ...dogs];

        interactables.forEach(res => {
            const dist = Math.hypot(player.x - res.x, player.y - res.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestInteractable = res;
            }
        });

        const activeItem = player.inventory[player.activeSlot]?.item;

        if (closestInteractable) {
            let instantActionTaken = false;

            // --- Priority 1: Instant actions ---
            if ('type' in closestInteractable) {
                const interactable = closestInteractable as Building | Portal; // Help TS narrow the type
                 if (interactable.type === 'door') {
                    setBuildings(bs => bs.map(b => b.id === interactable.id ? { ...b, isOpen: !b.isOpen } : b));
                    playSound((interactable as Building).isOpen ? SOUNDS.DOOR_CLOSE : SOUNDS.DOOR_OPEN);
                    instantActionTaken = true;
                } else if (interactable.type === 'tnt') {
                    handleExplosion(interactable.x, interactable.y, TNT_RADIUS, TNT_DAMAGE, true);
                    setBuildings(bs => bs.filter(b => b.id !== interactable.id));
                    instantActionTaken = true;
                } else if (interactable.type === 'workbench' && !collectingState) {
                    setGameState(GameState.WORKBENCH);
                    instantActionTaken = true;
                } else if (interactable.type === 'enchanting_table' && !collectingState) {
                    setActiveEnchantingTable(interactable as Building);
                    setGameState(GameState.ENCHANTING);
                    instantActionTaken = true;
                } else if (interactable.type === 'chest' && !collectingState) {
                    setActiveChest(interactable as Building);
                    setGameState(GameState.CHEST_UI);
                    instantActionTaken = true;
                } else if (interactable.type === 'furnace' && !collectingState) {
                    setActiveFurnace(interactable as Building);
                    setGameState(GameState.FURNACE);
                    instantActionTaken = true;
                } else if (interactable.type === 'bed') {
                    if (isNight && !isBloodMoon) {
                        setShowSleepConfirm(true);
                    }
                    instantActionTaken = true;
                } else if (interactable.type === 'portal') {
                    if(interactable.targetDimension === 'RUBY'){
                        setActivePortal(interactable as Portal);
                        setGameState(GameState.PORTAL_UI);
                    } else { // It's a return portal
                        returnToOverworld();
                    }
                    instantActionTaken = true;
                } else if (typeof interactable.type === 'number') { // It's an NPC
                    const npc = interactable as NPC;
                    setActiveNPC(npc);
                    if (npc.type === NPCType.QUEST_GIVER) {
                        setGameState(GameState.QUEST_UI);
                    } else if (npc.type === NPCType.VENDOR) {
                        setGameState(GameState.VENDOR_SHOP);
                    }
                    instantActionTaken = true;
                }
            } else if ('ownerId' in closestInteractable) { // It's a dog
                const dog = closestInteractable;
                if (dog.ownerId === player.id) { // It's our tamed dog - instant action
                    setDogs(ds => ds.map(d => d.id === dog.id ? { ...d, state: d.state === DogState.SITTING ? DogState.FOLLOWING : DogState.SITTING } : d));
                    playSound(SOUNDS.DOG_BARK, { volume: 0.5 });
                    instantActionTaken = true;
                }
            }

            if (instantActionTaken) {
                keysPressed['e'] = false; // Consume keypress to prevent other actions
            }

            // --- Priority 2: Hold-to-interact actions ---
            if (keysPressed['e']) {
                if ('ownerId' in closestInteractable) { // Taming a wild dog
                    const dog = closestInteractable;
                    if (dog.state === DogState.WILD && (activeItem?.id === 'food' || activeItem?.id === 'cooked_meat')) {
                        if (!tamingState || tamingState.dogId !== dog.id) {
                            setTamingState({ dogId: dog.id, progress: 0 });
                        } else {
                            const newProgress = tamingState.progress + dt / DOG_STATS.tamingTime;
                            if (newProgress >= 1) {
                                setDogs(ds => ds.map(d => d.id === dog.id ? { ...d, ownerId: player.id, state: DogState.FOLLOWING, hp: d.maxHp, speed: DOG_STATS.speed } : d));
                                setDogBeingNamed(dog);
                                setGameState(GameState.NAMING_PET);
                                setTamingState(null);
                            } else {
                                setTamingState({ ...tamingState, progress: newProgress });
                            }
                        }
                    }
                } else { // Collecting from resource or building
                    const closestNode = closestInteractable;
                    if (creativeMode) {
                        if ('type' in closestNode && ['workbench', 'chest', 'furnace', 'enchanting_table'].includes(closestNode.type as string)) {
                            setBuildings(b => b.filter(b => b.id !== closestNode!.id));
                            playSound(SOUNDS.COLLECT_WOOD);
                            const building = closestNode as Building;
                            addToInventory(ITEMS[building.type], 1);
                        } else {
                            const nodeToDestroy = closestNode as ResourceNode;
                            setResources(res => res.filter(r => r.id !== nodeToDestroy.id));
                             if (nodeToDestroy.type === ResourceType.WOOD) playSound(SOUNDS.COLLECT_WOOD); else playSound(SOUNDS.COLLECT_STONE);
                            const collectedItem = ITEMS[nodeToDestroy.type.toLowerCase()];
                            if(collectedItem) addToInventory(collectedItem, 1);
                        }
                        return;
                    }
                    
                    let baseTime = 5000;
                    let collectSpeedMultiplier = 1;
                    let canCollect = false;
                    let itemToGive: Item | null = null;
                    let amountToGive = 1;

                    if ('respawnTimer' in closestNode) { // It's a ResourceNode
                        const node = closestNode;
                        const dropId = node.type === ResourceType.IRON ? 'iron_ore' : node.type === ResourceType.GOLD ? 'gold_ore' : node.type.toLowerCase();
                        itemToGive = ITEMS[dropId];
                        amountToGive = node.type === ResourceType.WOOD ? 2 : 1; 
                        const activeTool = player.tool;
                        let currentTier = ToolTier.HAND;
                        
                        if (activeTool?.type === 'tool' && activeTool.toolType) {
                             if (node.type === ResourceType.WOOD && activeTool.toolType === 'axe') {
                                currentTier = activeTool.tier;
                                collectSpeedMultiplier = activeTool.collectSpeed ?? 1;
                            } else if (node.type !== ResourceType.WOOD && activeTool.toolType === 'pickaxe') {
                                currentTier = activeTool.tier;
                                collectSpeedMultiplier = activeTool.collectSpeed ?? 1;
                                const efficiency = activeTool.enchantments?.find(e => e.type === Enchantment.EFFICIENCY);
                                if (efficiency) {
                                    collectSpeedMultiplier *= (1 + efficiency.level * 0.2);
                                }
                            }
                        }
                        const requiredTier = RESOURCE_DATA[node.type].requiredTier;
                        if (currentTier >= requiredTier) {
                            canCollect = true;
                            baseTime = RESOURCE_DATA[node.type].baseCollectTime;
                        }
                    } else if ('type' in closestNode && ['workbench', 'chest', 'furnace', 'enchanting_table'].includes(closestNode.type as string)) { // It's a building
                        canCollect = true;
                        itemToGive = ITEMS[closestNode.type as 'workbench' | 'chest' | 'furnace' | 'enchanting_table'];
                        baseTime = 3000;
                    }
                    
                    if (canCollect) {
                        if (!collectingState || collectingState.nodeId !== closestNode.id) {
                            setCollectingState({ nodeId: closestNode.id, progress: 0 });
                        } else {
                            const progressIncrement = (dt / (baseTime / collectSpeedMultiplier));
                            const newProgress = collectingState.progress + progressIncrement;
                            if (newProgress >= 1) {
                                 if(itemToGive) addToInventory(itemToGive, amountToGive);

                                 setPlayer(p => {
                                    const newTool = p.tool ? { ...p.tool } : null;
                                    if(newTool?.durability !== undefined) {
                                        let durabilityLoss = 1;
                                        const unbreaking = newTool.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
                                        if (unbreaking && Math.random() < 1 - (1 / (unbreaking.level + 1))) {
                                            durabilityLoss = 0;
                                        }

                                        if (durabilityLoss > 0) {
                                            newTool.durability -= 1;
                                            if (newTool.durability <= 0) {
                                                playSound(SOUNDS.ITEM_BREAK);
                                                return { ...p, tool: null };
                                            }
                                        }
                                        return { ...p, tool: newTool };
                                    }
                                    return p;
                                 });
                                 
                                 const nodeToDestroy = closestNode;
                                 if ('respawnTimer' in nodeToDestroy) {
                                    if (nodeToDestroy.type === ResourceType.WOOD) playSound(SOUNDS.COLLECT_WOOD); else playSound(SOUNDS.COLLECT_STONE);
                                    setResources(res => res.filter(r => r.id !== nodeToDestroy.id));
                                    setDestroyedResources(d => [...d, {...(nodeToDestroy as ResourceNode), respawnTimer: RESOURCE_RESPAWN_MS}])
                                 } else if ('type' in nodeToDestroy) {
                                     playSound(SOUNDS.COLLECT_WOOD);
                                     setBuildings(b => b.filter(b => b.id !== nodeToDestroy.id));
                                 }

                                 setCollectingState(null);
                            } else {
                                 setCollectingState(cs => cs ? { ...cs, progress: newProgress } : null);
                            }
                        }
                    } else {
                        setCollectingState(null);
                    }
                }
            }
        } else if (activeItem && ['workbench', 'chest', 'bed', 'furnace', 'enchanting_table', 'tnt'].includes(activeItem.id)) {
            // Priority 3: Place block if nothing else to do
            const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
            const placementDist = TILE_SIZE * 1.5;
            const targetX = player.x + Math.cos(angle) * placementDist;
            const targetY = player.y + Math.sin(angle) * placementDist;
            
            const gridX = Math.floor(targetX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            const gridY = Math.floor(targetY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

            const isOccupied = [...buildings, ...resources].some(obj => obj.x === gridX && obj.y === gridY);
            if (!isOccupied) {
                const material = 'stone';
                const maxHp = BLOCK_HP[material] || 20;

                playSound(SOUNDS.COLLECT_WOOD);
                const newBuilding: Building = {
                    id: `building_${Date.now()}_${Math.random()}`,
                    x: gridX, y: gridY, size: TILE_SIZE,
                    type: activeItem.id as 'workbench' | 'chest' | 'bed' | 'furnace' | 'enchanting_table' | 'tnt',
                    material: material,
                    hp: maxHp, maxHp: maxHp,
                };
                if (newBuilding.type === 'chest') {
                    newBuilding.inventory = Array.from({ length: CHEST_INVENTORY_SLOTS }, () => ({ item: null }));
                } else if (newBuilding.type === 'furnace') {
                    newBuilding.inventory = Array.from({ length: FURNACE_INVENTORY_SLOTS }, () => ({ item: null }));
                    newBuilding.smeltProgress = 0;
                    newBuilding.fuelLeft = 0;
                }

                setBuildings(b => [...b, newBuilding]);

                setPlayer(p => {
                    const newInventory = [...p.inventory];
                    const currentSlot = newInventory[p.activeSlot];
                    if (currentSlot.item && currentSlot.item.quantity > 1) {
                        currentSlot.item.quantity -= 1;
                    } else {
                        currentSlot.item = null;
                    }
                    return { ...p, inventory: newInventory };
                });
            }
            keysPressed['e'] = false; // Prevent re-triggering
        } else {
            setCollectingState(null);
            setTamingState(null);
        }
    } else {
        setCollectingState(null);
        setTamingState(null);
    }

  }, [gameState, isNight, isBloodMoon, isRaining, day, player, keysPressed, resources, buildings, zombies, animals, npcs, dogs, itemDrops, collectingState, tamingState, addToInventory, creativeMode, invisible, noclip, mousePos, portals, returnToOverworld, currentBiome, takeDamage, initGame, handleExplosion]);

    // Check for inventory crafting recipes
    useEffect(() => {
        const gridItems = player.craftingGrid.map(slot => slot.item?.id || null).filter(Boolean).sort();
        if(gridItems.length === 0) {
            setPlayer(p => p.craftingOutput.item === null ? p : {...p, craftingOutput: { item: null }});
            return;
        };

        const recipeKey = JSON.stringify(gridItems);
        const recipe = INVENTORY_CRAFTING_RECIPES.get(recipeKey);

        setPlayer(p => {
            if (recipe) {
                const newOutputItem = { ...recipe.result, quantity: recipe.quantity };
                if (p.craftingOutput.item?.id === newOutputItem.id && p.craftingOutput.item?.quantity === newOutputItem.quantity) {
                    return p;
                }
                return { ...p, craftingOutput: { item: newOutputItem } };
            }
            if (p.craftingOutput.item === null) {
                return p;
            }
            return { ...p, craftingOutput: { item: null } };
        });

    }, [player.craftingGrid]);

    // Sound effects based on state changes
    useEffect(() => {
        const ambientId = 'ambient_sound';
        const rainId = 'rain_sound';

        if (gameState !== GameState.PLAYING) {
            stopAllSounds();
            return;
        }

        if (isRaining) {
            stopSound(ambientId); // Rain overrides biome sounds
            playSound(SOUNDS.RAIN, { loop: true, id: rainId, volume: 0.5 });
        } else {
            stopSound(rainId);
            let soundToPlay: string | null = null;
            if (player.dimension === 'RUBY') {
                soundToPlay = SOUNDS.AMBIENT_RUBY;
            } else if (isNight) {
                soundToPlay = SOUNDS.AMBIENT_NIGHT;
            } else {
                switch (currentBiome) {
                    case Biome.PLAINS: soundToPlay = SOUNDS.AMBIENT_PLAINS_DAY; break;
                    case Biome.FOREST: soundToPlay = SOUNDS.AMBIENT_FOREST_DAY; break;
                    case Biome.DESERT: soundToPlay = SOUNDS.AMBIENT_DESERT_DAY; break;
                    case Biome.SNOW: soundToPlay = SOUNDS.AMBIENT_SNOW_DAY; break;
                    case Biome.LAVA: soundToPlay = SOUNDS.AMBIENT_LAVA; break;
                    case Biome.WATER: soundToPlay = SOUNDS.AMBIENT_WATER; break;
                }
            }
            if (soundToPlay) {
                playSound(soundToPlay, { loop: true, id: ambientId, volume: 0.3 });
            } else {
                stopSound(ambientId);
            }
        }

    }, [gameState, isRaining, isNight, player.dimension, currentBiome]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw Biome Background
    const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(camera.y / TILE_SIZE) * TILE_SIZE;
    const endX = startX + width + TILE_SIZE;
    const endY = startY + height + TILE_SIZE;

    for (let x = startX; x < endX; x += TILE_SIZE) {
        for (let y = startY; y < endY; y += TILE_SIZE) {
            const biome = getBiomeAt(x + TILE_SIZE / 2, y + TILE_SIZE / 2, player.dimension);
            ctx.fillStyle = BIOME_DATA[biome].color;
            ctx.fillRect(x - camera.x, y - camera.y, TILE_SIZE, TILE_SIZE);
        }
    }
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw Craters
    explosions.forEach(exp => {
        const life = (Date.now() - exp.createdAt) / CRATER_DURATION_MS;
        ctx.fillStyle = `rgba(87, 65, 43, ${1 - life})`; // Dark brown, fades out
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
    });

     if (isNight && player.dimension === 'OVERWORLD') {
        ctx.fillStyle = isBloodMoon ? 'rgba(100, 0, 0, 0.3)' : 'rgba(0, 0, 20, 0.4)';
        ctx.fillRect(camera.x, camera.y, width, height);
    }


    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.lifespan / p.maxLifespan; // Fading effect
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0; // Reset alpha
    
    // Draw portals
    portals.forEach(p => {
        const portalWidth = p.sizeX || p.size;
        const portalHeight = p.sizeY || p.size;
        ctx.fillStyle = '#6A0DAD';
        ctx.fillRect(p.x - portalWidth / 2, p.y - portalHeight / 2, portalWidth, portalHeight);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(p.x - portalWidth / 2 + 5, p.y - portalHeight / 2 + 5, portalWidth - 10, portalHeight - 10);
    });

    // Draw resources
    resources.forEach(res => {
        ctx.fillStyle = RESOURCE_DATA[res.type]?.color || '#FFFFFF';
        ctx.fillRect(res.x - res.size / 2, res.y - res.size / 2, res.size, res.size);
    });
    
    // Draw buildings
    buildings.forEach(b => {
        if (b.type === 'door') {
            ctx.fillStyle = RESOURCE_DATA[b.material]?.color || '#A0522D';
            if (b.isOpen) {
                 ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size / 4, b.size);
            } else {
                 ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            }
        } else if (b.type === 'bed') {
            ctx.fillStyle = '#8B4513'; // Frame
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            ctx.fillStyle = '#DC143C'; // Blanket
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size * 0.7);
            ctx.fillStyle = '#FFFFFF'; // Pillow
            ctx.fillRect(b.x - b.size/2 + b.size * 0.1, b.y + b.size/2 - b.size*0.25, b.size*0.8, b.size*0.2);
        } else if (b.type === 'furnace') {
            ctx.fillStyle = '#696969';
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
            if (b.fuelLeft && b.fuelLeft > 0) {
                 ctx.fillStyle = '#FF4500'; // Fire color
                 ctx.fillRect(b.x - b.size / 4, b.y, b.size / 2, b.size / 2);
            }
        } else if (b.type === 'enchanting_table') {
             ctx.fillStyle = '#4B0082'; // Indigo base
             ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
             ctx.fillStyle = '#FF69B4'; // Pink corners
             ctx.fillRect(b.x - b.size/2, b.y - b.size/2, 10, 10);
             ctx.fillRect(b.x + b.size/2 - 10, b.y - b.size/2, 10, 10);
             ctx.fillRect(b.x - b.size/2, b.y + b.size/2 - 10, 10, 10);
             ctx.fillRect(b.x + b.size/2 - 10, b.y + b.size/2 - 10, 10, 10);
             ctx.fillStyle = '#E6E6FA'; // Lavender book
             ctx.fillRect(b.x - 10, b.y - 15, 20, 10);
        } else if (b.type === 'tnt') {
             ctx.fillStyle = '#FF0000'; // Red
             ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
             ctx.fillStyle = '#FFFFFF'; // White text
             ctx.font = 'bold 24px sans-serif';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('TNT', b.x, b.y);
        } else {
            ctx.fillStyle = b.type === 'workbench' ? '#A0522D' : b.type === 'chest' ? '#C2B280' : RESOURCE_DATA[b.material]?.color || '#888';
            ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
        }

        if (b.type === 'workbench') {
            ctx.fillStyle = 'black';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('W', b.x, b.y);
        }
        if (b.type === 'chest') {
            ctx.fillStyle = '#5C4033';
             ctx.fillRect(b.x - b.size / 2 + 5, b.y - b.size / 2 + 5, b.size - 10, 10);
        }
        if (b.hp < b.maxHp) {
            const barY = b.y - b.size / 2 - 10;
            ctx.fillStyle = '#555';
            ctx.fillRect(b.x - b.size / 2, barY, b.size, 5);
            ctx.fillStyle = 'red';
            ctx.fillRect(b.x - b.size / 2, barY, b.size * (b.hp / b.maxHp), 5);
        }
    });

    // Draw item drops
    itemDrops.forEach(drop => {
        let color = '#FFA500';
        if (drop.item.id === 'money') {
            color = '#8B4513';
        } else {
            const itemData = ITEMS[drop.item.id];
            if (itemData.type === 'resource' || itemData.type === 'smeltable' || itemData.type === 'fuel') {
                color = RESOURCE_DATA[itemData.id.toUpperCase() as ResourceType]?.color || color;
            } else if (itemData.id === 'totem_ruby') {
                color = '#E0115F';
            }
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw animals
    animals.forEach(animal => {
        ctx.fillStyle = ANIMAL_STATS[AnimalType[animal.type] as keyof typeof ANIMAL_STATS].color;
        ctx.fillRect(animal.x - animal.size / 2, animal.y - animal.size / 2, animal.size, animal.size);
        // Draw black spot on cow
        if (animal.type === AnimalType.COW) {
            ctx.fillStyle = 'black';
            ctx.fillRect(animal.x - animal.size / 4, animal.y - animal.size/4, animal.size/2, animal.size/2);
        }
    });

    // Draw Dogs
    dogs.forEach(dog => {
        ctx.fillStyle = DOG_STATS.color;
        ctx.fillRect(dog.x - dog.size / 2, dog.y - dog.size / 2, dog.size, dog.size);
        if (dog.ownerId) {
            ctx.fillStyle = '#FF0000'; // Red collar
            ctx.fillRect(dog.x - dog.size / 2, dog.y - dog.size / 2, dog.size, 5);
        }
        if (dog.name) {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(dog.name, dog.x, dog.y - dog.size / 2 - 10);
        }
    });
    
    // Draw NPCs
    npcs.forEach(npc => {
        ctx.fillStyle = '#FFDBAC'; // Skin color
        ctx.fillRect(npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
        
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        const npcName = (npc.type === NPCType.VENDOR)
            ? (language === Language.PT ? translations[language].claudio : translations[language].hitler)
            : npc.name;
        ctx.fillText(npcName, npc.x, npc.y - npc.size / 2 - 10);
    });

    // Draw zombies
    const torchEquipped = player.offHand.item?.id === 'torch';
    const lightRadius = 350;

    zombies.forEach(zombie => {
        if (torchEquipped && isNight && player.dimension === 'OVERWORLD') {
            const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
            if (dist > lightRadius) return;
        }
        
        const color = ZOMBIE_STATS[ZombieType[zombie.type] as keyof typeof ZOMBIE_STATS].color;
        ctx.fillStyle = color;
        ctx.fillRect(zombie.x - zombie.size / 2, zombie.y - zombie.size / 2, zombie.size, zombie.size);

        if (zombie.isBoss && zombie.shieldActive) {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(zombie.x, zombie.y, zombie.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        if (zombie.hp < zombie.maxHp) {
            const barY = zombie.y - zombie.size / 2 - 10;
            ctx.fillStyle = '#555';
            ctx.fillRect(zombie.x - zombie.size / 2, barY, zombie.size, 5);
            ctx.fillStyle = 'red';
            ctx.fillRect(zombie.x - zombie.size / 2, barY, zombie.size * (zombie.hp / zombie.maxHp), 5);
        }
    });
    
    // Draw projectiles
    projectiles.forEach(p => {
        if (p.isRocket) {
             ctx.fillStyle = '#555';
             ctx.fillRect(p.x - 10, p.y - 4, 20, 8);
             ctx.fillStyle = 'orange';
             ctx.beginPath();
             ctx.arc(p.x + 10, p.y, 5, 0, Math.PI * 2);
             ctx.fill();
        } else if (p.isArrow) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-15, -2, 30, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = p.owner === 'player' ? 'yellow' : 'magenta';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Player
    ctx.fillStyle = 'royalblue';
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
    
    const playerShield = player.offHand.item;
    if (playerShield?.type === 'shield' && playerShield.durability && playerShield.durability > 0) {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    if (torchEquipped && isNight && player.dimension === 'OVERWORLD') {
        const grad = ctx.createRadialGradient(player.x, player.y, 50, player.x, player.y, lightRadius);
        grad.addColorStop(0, 'rgba(255, 220, 150, 0.2)');
        grad.addColorStop(1, 'rgba(255, 220, 150, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, lightRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw Rain/Fog overlay
    if(isRaining) {
        ctx.fillStyle = 'rgba(128, 128, 140, 0.3)';
        ctx.fillRect(0,0,width, height);
    }

  }, [player, resources, zombies, projectiles, buildings, camera, animals, dogs, itemDrops, isBloodMoon, isRaining, portals, particles, isNight, npcs, language, explosions]);

  const mainLoop = useCallback((currentTime: number) => {
    const dt = currentTime - lastFrameTime.current;
    if (dt > 16) { // Cap delta time to avoid large jumps
        lastFrameTime.current = currentTime;
        gameTick(dt);
        draw();
    }
    gameLoopRef.current = requestAnimationFrame(mainLoop);
  }, [gameTick, draw]);
  
    // --- Save/Load Logic ---
    const saveGame = useCallback(() => {
        if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return;
        try {
            const stateToSave = {
                player,
                resources,
                zombies,
                animals,
                dogs,
                npcs,
                itemDrops,
                buildings,
                portals,
                particles,
                day,
                isNight,
                isBloodMoon,
                isRaining,
                rainTimer,
                destroyedResources,
                timeInCycle,
                creativeMode,
                invisible,
                noclip,
                currentBiome,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
            setShowSaveMessage(true);
            setTimeout(() => setShowSaveMessage(false), 2000);
        } catch (error) {
            console.error("Failed to save game:", error);
        }
    }, [player, resources, zombies, buildings, day, isNight, timeInCycle, creativeMode, invisible, noclip, gameState, animals, dogs, itemDrops, isBloodMoon, isRaining, rainTimer, destroyedResources, portals, particles, currentBiome, npcs]);

    const loadGame = useCallback(() => {
        const savedStateJSON = localStorage.getItem(SAVE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                const loadedPlayer = {
                    ...createInitialPlayer(),
                    ...savedState.player,
                };
                setPlayer(loadedPlayer);
                setResources(savedState.resources || []);
                setDestroyedResources(savedState.destroyedResources || []);
                setZombies(savedState.zombies || []);
                setAnimals(savedState.animals || []);
                setDogs(savedState.dogs || []);
                setNpcs(savedState.npcs || []);
                setItemDrops(savedState.itemDrops || []);
                setBuildings(savedState.buildings || []);
                setPortals(savedState.portals || []);
                setParticles(savedState.particles || []);
                setDay(savedState.day || 1);
                setIsNight(savedState.isNight || false);
                setIsBloodMoon(savedState.isBloodMoon || false);
                setIsRaining(savedState.isRaining || false);
                setRainTimer(savedState.rainTimer || 0);
                setTimeInCycle(savedState.timeInCycle || 0);
                setCreativeMode(savedState.creativeMode || false);
                setInvisible(savedState.invisible || false);
                setNoclip(savedState.noclip || false);
                setCurrentBiome(savedState.currentBiome || Biome.PLAINS);
                setGameState(GameState.PLAYING);
            } catch (error) {
                console.error("Failed to load saved game:", error);
                localStorage.removeItem(SAVE_KEY);
                setSaveExists(false);
                initGame();
            }
        }
    }, [initGame]);

    const startNewGame = useCallback(() => {
        localStorage.removeItem(SAVE_KEY);
        setSaveExists(false);
        initGame();
    }, [initGame]);

    useEffect(() => {
        if (localStorage.getItem(SAVE_KEY)) {
            setSaveExists(true);
        }
    }, []);

    useEffect(() => {
        if (gameState !== GameState.PLAYING) return;
        const intervalId = setInterval(saveGame, 60000); // Autosave every 60 seconds
        return () => clearInterval(intervalId);
    }, [gameState, saveGame]);
    // --- End Save/Load Logic ---

  const giveCreativeItem = useCallback((item: Item) => {
      const quantity = item.stackable ? item.maxStack : 1;
      addToInventory(item, quantity);
  }, [addToInventory]);

  const spawnZombie = useCallback((type: ZombieType) => {
    const stats = ZOMBIE_STATS[ZombieType[type] as keyof typeof ZOMBIE_STATS];
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 500;
    const y = player.y + Math.sin(angle) * 500;
    setZombies(zs => [...zs, {
        id: `zombie_creative_${Date.now()}`, x, y, size: stats.size,
        hp: stats.hp, maxHp: stats.hp, damage: stats.damage, speed: stats.speed,
        type, targetId: 1, isBoss: type === ZombieType.BOSS, attackCooldown: 1000, lastAttackTime: 0,
        state: ZombieState.PURSUING, targetX: x, targetY: y, stateTimer: 0,
    }]);
  }, [player.x, player.y]);
  
  const spawnAnimal = useCallback((type: AnimalType) => {
    const stats = ANIMAL_STATS[AnimalType[type] as keyof typeof ANIMAL_STATS];
    const angle = Math.random() * Math.PI * 2;
    const x = player.x + Math.cos(angle) * 300;
    const y = player.y + Math.sin(angle) * 300;
    setAnimals(as => [...as, {
        id: `animal_creative_${Date.now()}`, x, y, size: stats.size,
        hp: stats.hp, speed: stats.speed, type, vx: 0, vy: 0, changeDirectionTimer: 0
    }]);
  }, [player.x, player.y]);

  const teleportPlayer = useCallback((pos: {x: number, y: number}) => {
      setPlayer(p => ({ ...p, x: pos.x, y: pos.y }));
  }, []);

  const manipulatePlayerStat = useCallback((stat: 'hp' | 'stamina' | 'energy', change: number) => {
      if (!creativeMode) return;
      setPlayer(p => {
          const newStats = { ...p };
          switch(stat) {
              case 'hp':
                  newStats.hp = Math.max(0, Math.min(p.maxHp, p.hp + change));
                  break;
              case 'stamina':
                  newStats.stamina = Math.max(0, Math.min(p.maxStamina, p.stamina + change));
                  break;
              case 'energy':
                  newStats.energy = Math.max(0, Math.min(p.maxEnergy, p.energy + change));
                  break;
          }
          if (newStats.hp <= 0 && stat === 'hp') {
               newStats.hp = 1;
          }
          return newStats;
      });
  }, [creativeMode]);

  const handleAttack = useCallback(() => {
    const now = Date.now();
    if (now - player.lastAttackTime < (player.weapon?.toolType?.includes('sword') ? 500 : 300)) return;

    setPlayer(p => {
        let newPlayerState = { ...p, lastAttackTime: now };
        let weapon = newPlayerState.weapon ? { ...newPlayerState.weapon } : null;

        const damageWeapon = (): boolean => { // returns true if weapon broke
            if (weapon && weapon.durability !== undefined) {
                let durabilityLoss = 1;
                const unbreaking = weapon.enchantments?.find(e => e.type === Enchantment.UNBREAKING);
                if (unbreaking && Math.random() < 1 - (1 / (unbreaking.level + 1))) {
                    durabilityLoss = 0;
                }
                
                if (durabilityLoss > 0) {
                    weapon.durability -= 1;
                    if (weapon.durability <= 0) {
                        playSound(SOUNDS.ITEM_BREAK);
                        weapon = null;
                        return true;
                    }
                }
            }
            return false;
        };

        if (weapon && ['pistol', 'rifle', 'ak47', 'bow', 'bazooka'].includes(weapon.toolType)) {
            const isBow = weapon.toolType === 'bow';
            const isAk = weapon.toolType === 'ak47';
            const isBazooka = weapon.toolType === 'bazooka';

            const ammoType = isBow ? 'arrow' : isBazooka ? 'rocket' : 'ammo';
            const ammoCost = isAk ? 2 : 1;
            
            const hasAmmo = (ammoType === 'ammo')
                ? newPlayerState.ammo >= ammoCost
                : newPlayerState.inventory.some(s => s.item?.id === ammoType && s.item.quantity >= 1);

            if (!hasAmmo) return p;

            playSound(isBow ? SOUNDS.PLAYER_ATTACK_SWORD : isBazooka ? SOUNDS.BAZOOKA_FIRE : SOUNDS.PLAYER_ATTACK_GUN);

            if (ammoType !== 'ammo') {
                const newInv = [...newPlayerState.inventory];
                for(let i = 0; i < newInv.length; i++) {
                    if (newInv[i].item?.id === ammoType) {
                        newInv[i].item!.quantity -= 1;
                        if(newInv[i].item!.quantity <= 0) newInv[i].item = null;
                        break;
                    }
                }
                newPlayerState.inventory = newInv;
            } else {
                newPlayerState.ammo -= ammoCost;
            }
            
            if(!isBow) { // Guns and bazooka attract zombies
                setZombies(zs => zs.map(z => {
                    const dist = Math.hypot(newPlayerState.x - z.x, newPlayerState.y - z.y);
                    if (dist < ZOMBIE_SOUND_INVESTIGATION_RADIUS && z.state !== ZombieState.PURSUING) {
                        return { ...z, state: ZombieState.INVESTIGATING, targetX: newPlayerState.x, targetY: newPlayerState.y, stateTimer: 0 };
                    }
                    return z;
                }));
            }

            damageWeapon();
            
            const projectileSpeed = isBazooka ? 12 : 15;
            let damage = weapon?.damage || 0;
            const sharpness = weapon?.enchantments?.find(e => e.type === Enchantment.SHARPNESS);
            if(sharpness) damage += sharpness.level * 4;

            const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
            const projectileSpawnOffset = newPlayerState.size / 2 + 10;
            const startX = newPlayerState.x + Math.cos(angle) * projectileSpawnOffset;
            const startY = newPlayerState.y + Math.sin(angle) * projectileSpawnOffset;
            
            const homing = weapon?.enchantments?.find(e => e.type === Enchantment.HOMING);
            let homingTargetId: string | undefined = undefined;
            if (homing) {
                 const nearbyZombies = zombies.filter(z => Math.hypot(p.x - z.x, p.y - z.y) < 800);
                 if (nearbyZombies.length > 0) {
                     homingTargetId = nearbyZombies[0].id;
                 }
            }
            
            const createProjectile = (offsetAngle = 0) => ({
                id: `proj_${Date.now()}_${Math.random()}`, x: startX, y: startY,
                size: isBow ? 30 : isBazooka ? 20 : 10,
                vx: Math.cos(angle + offsetAngle) * projectileSpeed,
                vy: Math.sin(angle + offsetAngle) * projectileSpeed,
                damage: damage,
                owner: 'player' as 'player',
                lifespan: 2000,
                isArrow: isBow,
                isRocket: isBazooka,
                homingTargetId,
            });

            const newProjectiles = [createProjectile()];
            if (isAk) setTimeout(() => setProjectiles(projs => [...projs, createProjectile(0.05)]), 100);
            setProjectiles(projs => [...projs, ...newProjectiles]);

        } else { // Melee
            playSound(SOUNDS.PLAYER_ATTACK_SWORD);
            const attackRange = 80;
            let attackDamage = weapon?.damage || 2;
            const sharpness = weapon?.enchantments?.find(e => e.type === Enchantment.SHARPNESS);
            if (sharpness) {
                attackDamage += sharpness.level * 4;
            }

            const targets = [...zombies, ...animals, ...dogs.filter(d => d.state === DogState.WILD || d.state === DogState.HOSTILE)];
            const affectedTargetIds = new Set<string>();
            targets.forEach(target => {
                if (Math.hypot(newPlayerState.x - target.x, newPlayerState.y - target.y) < attackRange) {
                    affectedTargetIds.add(target.id);
                }
            });

            if (affectedTargetIds.size > 0) {
                const broke = damageWeapon();
                if (broke && (weapon?.durability || 1) <= 0) { // check if it just broke
                    // Don't deal damage
                } else {
                    setZombies(prev => prev.map(z => {
                        if(affectedTargetIds.has(z.id)) {
                             if (z.isBoss && z.shieldActive && weapon?.toolType !== 'sword') {
                                playSound(SOUNDS.SHIELD_HIT);
                                return z;
                            }
                            playSound(SOUNDS.ZOMBIE_HURT, { volume: 0.6 });
                            const newHp = z.hp - attackDamage;
                             if(z.type === ZombieType.RUBY && newHp <= 0 && Math.random() < 0.2) {
                                setItemDrops(d => [...d, {id: `drop_ruby_${Date.now()}`, x: z.x, y: z.y, size: 20, item: ITEMS.ruby}]);
                            }
                            return { ...z, hp: newHp };
                        }
                        return z;
                    }));
                     setAnimals(prev => {
                        const newDrops: ItemDrop[] = [];
                        const remaining = prev.map(a => {
                            if (affectedTargetIds.has(a.id)) {
                                const newHp = a.hp - attackDamage;
                                if(newHp <= 0) {
                                    newDrops.push({ id: `drop_food_${Date.now()}_${a.id}`, x: a.x, y: a.y, size: 20, item: ITEMS['food'] });
                                    if(a.type === AnimalType.SHEEP) newDrops.push({ id: `drop_wool_${Date.now()}_${a.id}`, x: a.x + 10, y: a.y + 10, size: 20, item: ITEMS['wool'] });
                                    return null;
                                }
                                return { ...a, hp: newHp };
                            }
                            return a;
                        }).filter((a): a is Animal => a !== null);
                        if (newDrops.length > 0) setItemDrops(d => [...d, ...newDrops]);
                        return remaining;
                    });
                    setDogs(prev => prev.map(d => affectedTargetIds.has(d.id) ? { ...d, hp: d.hp - attackDamage, state: DogState.HOSTILE } : d));
                    setDogs(ds => ds.map(d => {
                        if (d.ownerId === newPlayerState.id) {
                            const firstTargetId = Array.from(affectedTargetIds)[0];
                            if (firstTargetId) return { ...d, state: DogState.ATTACKING, targetId: firstTargetId };
                        }
                        return d;
                    }));
                }
            }
        }
        
        newPlayerState.weapon = weapon;
        return newPlayerState;
    });
  }, [player, mousePos, zombies, animals, dogs, handleExplosion]);

    const handleEatFood = useCallback(() => {
        setPlayer(p => {
            const activeSlotIndex = p.activeSlot;
            const activeSlot = p.inventory[activeSlotIndex];
            const item = activeSlot?.item;

            if (item && (item.type === 'consumable' || item.id === 'food')) {
                playSound(SOUNDS.PLAYER_EAT);
                const consumable = item as Consumable;
                const newInventory = p.inventory.map((slot, index) => {
                    if (index === activeSlotIndex) {
                        const newItem = { ...slot.item! };
                        newItem.quantity -= 1;
                        return { item: newItem.quantity > 0 ? newItem : null };
                    }
                    return slot;
                });
                
                let newHp = p.hp;
                let newStamina = p.stamina;

                if (consumable.heals) {
                    newHp = Math.max(0, Math.min(p.maxHp, p.hp + consumable.heals));
                    if (newHp <= 0) {
                        setGameState(GameState.GAME_OVER);
                    } else if (consumable.heals < 0) {
                        playSound(SOUNDS.PLAYER_HURT);
                    }
                }
                if (consumable.stamina) {
                    newStamina = Math.min(p.maxStamina, p.stamina + consumable.stamina);
                }

                return { 
                    ...p, 
                    hp: newHp, 
                    stamina: newStamina,
                    inventory: newInventory, 
                    lastDamageTime: (consumable.heals || 0) < 0 ? Date.now() : p.lastDamageTime 
                };
            }
            return p;
        });
    }, []);

    const toggleBloodMoon = useCallback(() => {
        setIsBloodMoon(isBM => {
            const nextState = !isBM;
            if (nextState) {
                setIsNight(true);
                setTimeInCycle(0);
            }
            return nextState;
        });
    }, []);

    const toggleRain = useCallback(() => {
        setIsRaining(isR => {
            const nextState = !isR;
            if (nextState) {
                setRainTimer(RAIN_DURATION_MS);
            } else {
                setRainTimer(0);
            }
            return nextState;
        });
    }, []);

    const skipNight = useCallback(() => {
        setDay(d => d + 1);
        setIsNight(false);
        setTimeInCycle(0);
        setZombies(zs => zs.filter(z => z.isBoss));
        setShowSleepConfirm(false);
        setPlayer(p => ({...p, energy: p.maxEnergy}));
    }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = true;

        switch (gameState) {
            case GameState.PLAYING:
                if (e.key >= '1' && e.key <= String(HOTBAR_SLOTS)) {
                    setPlayer(p => ({ ...p, activeSlot: parseInt(e.key) - 1 }));
                } else if (key === 'q') {
                    setGameState(GameState.INVENTORY);
                } else if (key === 'm') {
                    setCreativeMode(c => !c);
                } else if (key === 'r') {
                    handleEatFood();
                } else if (key === 'f') {
                    handleAttack();
                } else if (key === 'z') {
                    const activeItem = player.inventory[player.activeSlot]?.item;
                    if (activeItem && activeItem.type === 'block') {
                         if (['workbench', 'chest', 'furnace', 'enchanting_table', 'tnt'].includes(activeItem.id)) return; // These are placed with 'E'
                        const angle = Math.atan2(mousePos.y - window.innerHeight / 2, mousePos.x - window.innerWidth / 2);
                        const placementDist = TILE_SIZE * 1.5;
                        const targetX = player.x + Math.cos(angle) * placementDist;
                        const targetY = player.y + Math.sin(angle) * placementDist;
                        
                        const gridX = Math.floor(targetX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                        const gridY = Math.floor(targetY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

                        const isOccupied = [...buildings, ...resources].some(obj => obj.x === gridX && obj.y === gridY);
                        if (isOccupied) return;

                        playSound(SOUNDS.COLLECT_WOOD);
                        const material = activeItem.id.replace('_block', '').replace('_door', '');
                        const maxHp = BLOCK_HP[material] || 20;
                        const isDoor = activeItem.id.includes('_door');
                        
                        setBuildings(b => [...b, {
                            id: `building_${Date.now()}_${Math.random()}`,
                            x: gridX, y: gridY, size: TILE_SIZE,
                            type: isDoor ? 'door' : activeItem.id === 'bed' ? 'bed' : 'block',
                            material: material,
                            hp: maxHp, maxHp: maxHp,
                            isOpen: false,
                        }]);

                        setPlayer(p => {
                            const newInventory = [...p.inventory];
                            const currentSlot = newInventory[p.activeSlot];
                            if (currentSlot.item && currentSlot.item.quantity > 1) {
                                currentSlot.item.quantity -= 1;
                            } else {
                                currentSlot.item = null;
                            }
                            return { ...p, inventory: newInventory };
                        });
                    }
                } else if (key === 'c' && creativeMode) {
                    setGameState(GameState.CREATIVE_INVENTORY);
                } else if (key === 'h' && creativeMode) {
                    setInvisible(i => !i);
                } else if (key === 'v' && creativeMode) {
                    setNoclip(n => !n);
                }
                break;
            case GameState.INVENTORY:
            case GameState.CREATIVE_INVENTORY:
            case GameState.WORKBENCH:
            case GameState.PORTAL_UI:
            case GameState.CHEST_UI:
            case GameState.FURNACE:
            case GameState.QUEST_UI:
            case GameState.VENDOR_SHOP:
            case GameState.NAMING_PET:
            case GameState.ENCHANTING:
                if (key === 'q' || key === 'escape') {
                    if (gameState === GameState.CHEST_UI) playSound(SOUNDS.CHEST_CLOSE);
                    setGameState(GameState.PLAYING);
                    setActivePortal(null);
                    setActiveChest(null);
                    setActiveFurnace(null);
                    setActiveEnchantingTable(null);
                    setActiveNPC(null);
                    setDogBeingNamed(null);
                }
                break;
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => { setMousePos({ x: e.clientX, y: e.clientY }); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [player, mousePos, zombies, gameState, creativeMode, camera, handleAttack, handleEatFood, buildings, resources]);

    useEffect(() => {
        const previousGameState = new Map<GameState, boolean>();
        if (!previousGameState.has(gameState)) {
            switch(gameState) {
                case GameState.INVENTORY:
                case GameState.CREATIVE_INVENTORY:
                case GameState.WORKBENCH:
                case GameState.PORTAL_UI:
                case GameState.QUEST_UI:
                case GameState.VENDOR_SHOP:
                case GameState.ENCHANTING:
                    playSound(SOUNDS.UI_OPEN);
                    break;
                case GameState.CHEST_UI:
                    playSound(SOUNDS.CHEST_OPEN);
                    break;
                case GameState.FURNACE:
                    playSound(SOUNDS.FURNACE_FIRE);
                    break;
                case GameState.GAME_OVER:
                    stopAllSounds();
                    playSound(SOUNDS.PLAYER_DEATH);
                    setTimeout(() => playSound(SOUNDS.GAME_OVER), 700);
                    break;
            }
             if (gameState === GameState.PLAYING) {
                playSound(SOUNDS.UI_CLOSE);
            }
        }
    }, [gameState]);


  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        lastFrameTime.current = performance.now();
        gameLoopRef.current = requestAnimationFrame(mainLoop);
    } else {
        if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
    return () => {
        if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, mainLoop]);
  
  useEffect(() => {
    const resizeCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            draw();
        }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  const handleEnchant = useCallback((enchantment: ItemEnchantment) => {
    // FIX: Replaced non-existent ENCHANT_SUCCESS sound with CRAFT_SUCCESS as suggested by the error.
    playSound(SOUNDS.CRAFT_SUCCESS);
    setPlayer(p => {
        const newSlots = [...p.enchantingSlots];
        const itemToEnchant = newSlots[0].item;
        const crystal = newSlots[1].item;

        if (!itemToEnchant || !crystal) return p;

        const newItem = { ...itemToEnchant, enchantments: [...(itemToEnchant.enchantments || [])] };
        
        const existingEnchantIndex = newItem.enchantments.findIndex(e => e.type === enchantment.type);
        if (existingEnchantIndex > -1) {
            newItem.enchantments[existingEnchantIndex] = enchantment;
        } else {
            newItem.enchantments.push(enchantment);
        }

        newSlots[0].item = newItem;
        
        crystal.quantity -= 1;
        if (crystal.quantity <= 0) {
            newSlots[1].item = null;
        }

        return {...p, enchantingSlots: newSlots};
    });
    setEnchantmentOptions([]);
  }, []);

  return (
    <div className="w-screen h-screen relative bg-black">
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
      <GameUI
        gameState={gameState}
        setGameState={setGameState}
        language={language}
        setLanguage={setLanguage}
        player={player}
        setPlayer={setPlayer}
        day={day}
        isNight={isNight}
        timeInCycle={timeInCycle}
        isBloodMoon={isBloodMoon}
        isRaining={isRaining}
        startNewGame={startNewGame}
        loadGame={loadGame}
        saveExists={saveExists}
        showSaveMessage={showSaveMessage}
        addToInventory={addToInventory}
        collectingState={collectingState}
        resources={[...resources, ...buildings, ...portals, ...npcs, ...dogs]}
        camera={camera}
        creativeMode={creativeMode}
        noclip={noclip}
        invisible={invisible}
        giveCreativeItem={giveCreativeItem}
        spawnZombie={spawnZombie}
        spawnAnimal={spawnAnimal}
        teleportPlayer={teleportPlayer}
        manipulatePlayerStat={manipulatePlayerStat}
        updatePlayerInventory={updatePlayerInventory}
        handleCraft={handleCraft}
        toggleBloodMoon={toggleBloodMoon}
        toggleRain={toggleRain}
        getBiomeAt={getBiomeAt}
        currentBiome={currentBiome}
        activePortal={activePortal}
        updatePlayerAndPortalInventories={updatePlayerAndPortalInventories}
        enterRubyDimension={enterRubyDimension}
        isNearReturnPortal={isNearReturnPortal}
        activeChest={activeChest}
        updatePlayerAndChestInventories={updatePlayerAndChestInventories}
        activeFurnace={activeFurnace}
        updatePlayerAndFurnaceInventories={updatePlayerAndFurnaceInventories}
        activeEnchantingTable={activeEnchantingTable}
        updatePlayerAndEnchantingSlots={updatePlayerAndEnchantingSlots}
        enchantmentOptions={enchantmentOptions}
        setEnchantmentOptions={setEnchantmentOptions}
        handleEnchant={handleEnchant}
        activeNPC={activeNPC}
        showSleepConfirm={showSleepConfirm}
        setShowSleepConfirm={setShowSleepConfirm}
        skipNight={skipNight}
        dogBeingNamed={dogBeingNamed}
        handleNamePet={handleNamePet}
        zombies={zombies}
        setZombies={setZombies}
        setDay={setDay}
        setIsNight={setIsNight}
        setTimeInCycle={setTimeInCycle}
        setIsRaining={setIsRaining}
        mousePos={mousePos}
      />
    </div>
  );
};

export default App;