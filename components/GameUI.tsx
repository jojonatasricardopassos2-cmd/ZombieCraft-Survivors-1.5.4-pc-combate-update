

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GameState, ZombieType, Language, Biome, NPCType, Quest, Dog, AnimalType, Enchantment, EnchantmentOption, ItemEnchantment } from '../types';
import type { Player, CollectingState, ResourceNode, Item, Tool, Armor, InventorySlot, Building, Portal, NPC, Zombie } from '../types';
import { DAY_DURATION_MS, NIGHT_DURATION_MS, BLOOD_MOON_DURATION_MS, ITEMS, VENDOR_ITEMS, CREATIVE_ITEMS, WORLD_WIDTH, WORLD_HEIGHT, HOTBAR_SLOTS, INVENTORY_SLOTS, CRAFTING_RECIPES, translations, PORTAL_REQUIREMENTS, CHEST_INVENTORY_SLOTS, SMELT_TIME, FUEL_DURATION, QUEST_LIST, ENCHANTMENT_DATA } from '../constants';
import { initAudioManager, playSound } from '../audioManager';
import { SOUNDS } from '../sounds';

interface GameUIProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  day: number;
  isNight: boolean;
  timeInCycle: number;
  isBloodMoon: boolean;
  isRaining: boolean;
  startNewGame: () => void;
  loadGame: () => void;
  saveExists: boolean;
  showSaveMessage: boolean;
  addToInventory: (item: any, quantity?: number) => boolean;
  collectingState: CollectingState | null;
  resources: (ResourceNode | Building | Portal | NPC | Dog)[];
  camera: { x: number; y: number };
  creativeMode: boolean;
  noclip: boolean;
  invisible: boolean;
  giveCreativeItem: (item: Item) => void;
  spawnZombie: (type: ZombieType) => void;
  spawnAnimal: (type: AnimalType) => void;
  teleportPlayer: (pos: {x: number, y: number}) => void;
  manipulatePlayerStat: (stat: 'hp' | 'stamina' | 'energy', change: number) => void;
  updatePlayerInventory: (inventory: InventorySlot[], equipment: { weapon: Tool | null, armor: Armor | null, tool: Tool | null, offHand: InventorySlot }, craftingGrid: InventorySlot[], craftingOutput: InventorySlot) => void;
  handleCraft: (itemId: string) => void;
  toggleBloodMoon: () => void;
  toggleRain: () => void;
  getBiomeAt: (x: number, y: number, dimension: 'OVERWORLD' | 'RUBY') => Biome;
  currentBiome: Biome;
  activePortal: Portal | null;
  updatePlayerAndPortalInventories: (playerInv: InventorySlot[], portalId: string, portalInv: InventorySlot[]) => void;
  enterRubyDimension: () => void;
  isNearReturnPortal: boolean;
  activeChest: Building | null;
  updatePlayerAndChestInventories: (playerInv: InventorySlot[], chestId: string, chestInv: InventorySlot[]) => void;
  activeFurnace: Building | null;
  updatePlayerAndFurnaceInventories: (playerInv: InventorySlot[], furnaceId: string, furnaceInv: InventorySlot[]) => void;
  activeEnchantingTable: Building | null;
  updatePlayerAndEnchantingSlots: (playerInv: InventorySlot[], enchantingSlots: InventorySlot[]) => void;
  enchantmentOptions: EnchantmentOption[];
  setEnchantmentOptions: React.Dispatch<React.SetStateAction<EnchantmentOption[]>>;
  handleEnchant: (enchantment: ItemEnchantment) => void;
  activeNPC: NPC | null;
  showSleepConfirm: boolean;
  setShowSleepConfirm: (show: boolean) => void;
  skipNight: () => void;
  dogBeingNamed: Dog | null;
  handleNamePet: (dogId: string, name: string) => void;
  zombies: Zombie[];
  setZombies: React.Dispatch<React.SetStateAction<Zombie[]>>;
  setDay: React.Dispatch<React.SetStateAction<number>>;
  setIsNight: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeInCycle: React.Dispatch<React.SetStateAction<number>>;
  setIsRaining: React.Dispatch<React.SetStateAction<boolean>>;
  mousePos: { x: number; y: number };
}

const getItemName = (item: Item, lang: Language) => {
    return lang === Language.PT ? item.name_pt : item.name;
};

const getDurabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
};

const MainMenu: React.FC<{
    onPlay: () => void;
    onContinue: () => void;
    saveExists: boolean;
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}> = ({ onPlay, onContinue, saveExists, t, language, setLanguage }) => {
    
    const handleAction = (action: () => void) => {
        playSound(SOUNDS.UI_CLICK);
        initAudioManager();
        action();
    }

    return (
      <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center text-white">
        <h1 className="text-8xl font-bold mb-4 text-red-500" style={{ textShadow: '2px 2px 4px #000' }}>ZombieCraft</h1>
        <h2 className="text-4xl font-semibold mb-12 text-gray-300">Survivors</h2>
        <div className="space-y-4 text-center">
            {saveExists && (
                 <button onClick={() => handleAction(onContinue)} className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-2xl transition-transform transform hover:scale-105">
                    {t('continue')}
                </button>
            )}
          <button onClick={() => handleAction(onPlay)} className="w-64 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-2xl transition-transform transform hover:scale-105">
            {t(saveExists ? 'newGame' : 'play')}
          </button>
           <button onClick={() => { playSound(SOUNDS.UI_CLICK); setLanguage(language === Language.EN ? Language.PT : Language.EN); }} className="w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg transition-transform transform hover:scale-105 mt-4">
            Language: {language}
          </button>
           <p className="text-xs text-gray-400">Press 'Q' for Inventory, 'Z' to Place Blocks, 'M' for Creative Mode</p>
        </div>
      </div>
    );
};

const HUD: React.FC<{ player: Player; day: number; isNight: boolean; timeInCycle: number; isBloodMoon: boolean; isRaining: boolean; setGameState: (state: GameState) => void; creativeMode: boolean; showSaveMessage: boolean; t: (key: string) => string; language: Language; currentBiome: Biome; isNearReturnPortal: boolean; }> = ({ player, day, isNight, timeInCycle, isBloodMoon, isRaining, setGameState, creativeMode, showSaveMessage, t, language, currentBiome, isNearReturnPortal }) => {
    const cycleDuration = isNight ? (isBloodMoon ? BLOOD_MOON_DURATION_MS : NIGHT_DURATION_MS) : DAY_DURATION_MS;
    const timePercentage = (timeInCycle / cycleDuration) * 100;
    const equippedWeapon = player.weapon;
    const isFirearm = equippedWeapon && ['pistol', 'rifle', 'ak47'].includes(equippedWeapon.toolType);
    const shield = player.offHand.item?.type === 'shield' ? player.offHand.item : null;

    return (
        <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 p-2 rounded-lg text-center">
                <p className="text-xl font-bold">{t('day')} {day} {creativeMode && <span className="text-purple-400">{t('creative')}</span>}</p>
                 <p className="text-sm text-gray-300">{t('biome')}: {currentBiome}</p>
                 {isBloodMoon && <p className="text-red-500 font-bold animate-pulse">{t('bloodMoon')}</p>}
                 {isRaining && <p className="text-blue-400 font-bold">{t('rain')}</p>}
                 {player.dimension === 'OVERWORLD' && <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-yellow-400" style={{ width: `${isNight ? 100-timePercentage : timePercentage}%` }}></div>
                </div>}
            </div>

            {isNearReturnPortal && (
                 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-purple-800 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    {t('returnToOverworld')}
                </div>
            )}
            
            {player.activeQuest && (
                <div className="absolute top-1/4 right-4 bg-yellow-800 bg-opacity-70 p-3 rounded-lg border-2 border-yellow-600">
                    <h3 className="text-lg font-bold text-yellow-300">{t('objective')}</h3>
                    <p>{language === Language.PT ? player.activeQuest.description_pt : player.activeQuest.description_en}</p>
                </div>
            )}

            {showSaveMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    {t('gameSaved')}
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-4 rounded-lg w-72 space-y-2">
                 <div>
                    <span className="text-red-500 font-bold">{t('hp')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-red-600 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.hp / player.maxHp) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <span className="text-blue-500 font-bold">{t('stamina')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-blue-500 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.stamina / player.maxStamina) * 100}%` }}></div>
                    </div>
                </div>
                 <div>
                    <span className="text-yellow-400 font-bold">{t('energy')}:</span>
                    <div className="w-full bg-gray-700 rounded-full h-5">
                        <div className="bg-yellow-400 h-5 rounded-full" style={{ width: `${creativeMode ? 100 : (player.energy / player.maxEnergy) * 100}%` }}></div>
                    </div>
                </div>
                {shield && shield.durability && shield.durability > 0 && shield.maxDurability && (
                     <div>
                        <span className="text-gray-400 font-bold">{t('shield')}:</span>
                        <div className="w-full bg-gray-700 rounded-full h-5">
                            <div className="bg-gray-400 h-5 rounded-full" style={{ width: `${(shield.durability / shield.maxDurability) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                <div className="text-yellow-600 font-bold">{t('yourCoins')}: {player.money}</div>
                {isFirearm && (
                     <div>
                        <span className="text-yellow-500 font-bold">{t('ammo')}: {player.ammo}</span>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {player.inventory.slice(0, HOTBAR_SLOTS).map((slot, index) => (
                    <div key={index} className={`w-16 h-16 bg-gray-800 bg-opacity-70 border-2 rounded-lg flex items-center justify-center relative ${player.activeSlot === index ? 'border-yellow-400 scale-110' : 'border-gray-500'}`}>
                        {slot.item && (
                            <>
                                <div className='w-full h-full flex flex-col items-center justify-center p-1'>
                                    <span className={`text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full text-center ${slot.item.enchantments && slot.item.enchantments.length > 0 ? 'text-purple-400' : ''}`} title={getItemName(slot.item, language)}>{getItemName(slot.item, language)}</span>
                                    <span className='text-lg font-bold'>{slot.item.quantity}</span>
                                </div>
                                {slot.item.durability !== undefined && slot.item.maxDurability !== undefined && (
                                     <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10/12 h-1.5 bg-gray-900 rounded-full">
                                        <div
                                            className={`h-full rounded-full ${getDurabilityColor(slot.item.durability, slot.item.maxDurability)}`}
                                            style={{ width: `${(slot.item.durability / slot.item.maxDurability) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </>
                        )}
                        <span className="absolute bottom-0 right-1 text-xs">{index + 1}</span>
                    </div>
                ))}
            </div>
             <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.SHOP); }} className="absolute bottom-24 right-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg hidden">{t('shop')}</button>
        </>
    );
};

const CreativePanel: React.FC<{
    setGameState: (state: GameState) => void;
    spawnZombie: (type: ZombieType) => void;
    spawnAnimal: (type: AnimalType) => void;
    teleportPlayer: (pos: {x:number, y:number}) => void;
    manipulatePlayerStat: (stat: 'hp' | 'stamina' | 'energy', change: number) => void;
    noclip: boolean;
    invisible: boolean;
    isBloodMoon: boolean;
    isRaining: boolean;
    toggleBloodMoon: () => void;
    toggleRain: () => void;
    t: (key: string) => string;
    setZombies: React.Dispatch<React.SetStateAction<Zombie[]>>;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    setDay: React.Dispatch<React.SetStateAction<number>>;
    setIsNight: React.Dispatch<React.SetStateAction<boolean>>;
    setTimeInCycle: React.Dispatch<React.SetStateAction<number>>;
    setIsRaining: React.Dispatch<React.SetStateAction<boolean>>;
}> = (props) => {
    const { setGameState, spawnZombie, spawnAnimal, teleportPlayer, manipulatePlayerStat, noclip, invisible, isBloodMoon, isRaining, toggleBloodMoon, toggleRain, t, setZombies, setPlayer, setDay, setIsNight, setTimeInCycle, setIsRaining } = props;
    const [tpX, setTpX] = useState(Math.floor(WORLD_WIDTH/2).toString());
    const [tpY, setTpY] = useState(Math.floor(WORLD_HEIGHT/2).toString());
    
    const handleClick = (action: () => void) => {
        playSound(SOUNDS.UI_CLICK);
        action();
    };

    return (
        <div className="absolute top-1/4 left-4 bg-gray-800 bg-opacity-80 p-4 rounded-lg w-72 text-sm space-y-2 overflow-y-auto max-h-[70vh]">
            <h3 className="text-lg font-bold text-purple-400 text-center">{t('creativeTools')}</h3>
            <button onClick={() => handleClick(() => setGameState(GameState.CREATIVE_INVENTORY))} className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded">{t('itemMenu')}</button>
            <div className='text-center'>
                <p className={noclip ? 'text-green-400' : 'text-red-400'}>{t('flyNoclip')}: {noclip ? t('on') : t('off')}</p>
                <p className={invisible ? 'text-green-400' : 'text-red-400'}>{t('invisibility')}: {invisible ? t('on') : t('off')}</p>
            </div>
            
            <div>
                 <h4 className="font-bold">{t('worldControls')}</h4>
                 <div className="grid grid-cols-2 gap-2 mt-1">
                    <button onClick={() => handleClick(() => { setDay(d => d + 1); setTimeInCycle(0); setIsNight(false); })} className={`bg-gray-600 hover:bg-gray-700 p-1 rounded`}>{t('skipDay')}</button>
                    <button onClick={() => handleClick(() => setIsNight(n => !n))} className={`bg-gray-600 hover:bg-gray-700 p-1 rounded`}>{t('toggleDayNight')}</button>
                    <button onClick={() => handleClick(toggleBloodMoon)} className={`${isBloodMoon ? 'bg-red-800 hover:bg-red-900' : 'bg-gray-600 hover:bg-gray-700'} p-1 rounded`}>{t('bloodMoon')}</button>
                    <button onClick={() => handleClick(() => {setIsRaining(!isRaining)})} className={`${isRaining ? 'bg-blue-800 hover:bg-blue-900' : 'bg-gray-600 hover:bg-gray-700'} p-1 rounded`}>{t('rain')}</button>
                 </div>
            </div>
            <div>
                <h4 className="font-bold">{t('playerCheats')}</h4>
                <div className="grid grid-cols-3 gap-1 mt-1">
                    <button onClick={() => handleClick(() => setPlayer(p => ({...p, hp: p.maxHp})))} className="bg-green-700 hover:bg-green-800 p-1 rounded">{t('heal')}</button>
                    <button onClick={() => handleClick(() => setPlayer(p => ({...p, stamina: p.maxStamina, energy: p.maxEnergy})))} className="bg-blue-700 hover:bg-blue-800 p-1 rounded">{t('maxStats')}</button>
                    <button onClick={() => handleClick(() => setPlayer(p => ({...p, money: p.money + 100})))} className="bg-yellow-600 hover:bg-yellow-700 p-1 rounded">{t('giveMoney')}</button>
                    <button onClick={() => handleClick(() => setPlayer(p => ({...p, ammo: p.ammo + 50})))} className="bg-yellow-700 hover:bg-yellow-800 p-1 rounded">{t('giveAmmo')}</button>
                    <button onClick={() => handleClick(() => setPlayer(p => ({...p, inventory: Array.from({ length: INVENTORY_SLOTS }, () => ({ item: null }))}))) } className="bg-red-800 hover:bg-red-900 p-1 rounded col-span-2">{t('clearInv')}</button>
                </div>
            </div>
             <div>
                <h4 className="font-bold">{t('entityManagement')}</h4>
                 <button onClick={() => handleClick(() => setZombies([]))} className="w-full bg-red-800 hover:bg-red-900 p-1 rounded mt-1">{t('killZombies')}</button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => handleClick(() => spawnZombie(ZombieType.NORMAL))} className="bg-green-700 hover:bg-green-800 p-1 rounded">{t('spawn')} {t('normal')}</button>
                    <button onClick={() => handleClick(() => spawnZombie(ZombieType.BOSS))} className="bg-red-800 hover:bg-red-900 p-1 rounded">{t('spawn')} {t('boss')}</button>
                    <button onClick={() => handleClick(() => spawnAnimal(AnimalType.PIG))} className="bg-pink-500 hover:bg-pink-600 p-1 rounded">{t('spawn')} {t('pig')}</button>
                    <button onClick={() => handleClick(() => spawnAnimal(AnimalType.COW))} className="bg-gray-400 hover:bg-gray-500 p-1 rounded">{t('spawn')} {t('cow')}</button>
                    <button onClick={() => handleClick(() => spawnAnimal(AnimalType.CHICKEN))} className="bg-yellow-200 text-black hover:bg-yellow-300 p-1 rounded">{t('spawn')} {t('chicken')}</button>
                    <button onClick={() => handleClick(() => spawnAnimal(AnimalType.SHEEP))} className="bg-gray-300 text-black hover:bg-gray-400 p-1 rounded">{t('spawn')} {t('sheep')}</button>
                </div>
            </div>
             <div>
                <h4 className="font-bold">{t('teleport')}</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <button onClick={() => handleClick(() => teleportPlayer({x:WORLD_WIDTH/2, y:WORLD_HEIGHT/2}))} className="bg-blue-600 hover:bg-blue-700 p-1 rounded">{t('center')}</button>
                    <button onClick={() => handleClick(() => teleportPlayer({x:100, y:100}))} className="bg-blue-600 hover:bg-blue-700 p-1 rounded">{t('border')}</button>
                </div>
                <div className="flex gap-2 mt-2">
                    <input type="number" value={tpX} onChange={e => setTpX(e.target.value)} className="w-1/2 bg-gray-900 p-1 rounded" placeholder="X" />
                    <input type="number" value={tpY} onChange={e => setTpY(e.target.value)} className="w-1/2 bg-gray-900 p-1 rounded" placeholder="Y" />
                </div>
                <button onClick={() => handleClick(() => teleportPlayer({x:parseInt(tpX), y:parseInt(tpY)}))} className="w-full bg-blue-600 hover:bg-blue-700 p-1 rounded mt-2">{t('go')}</button>
            </div>
        </div>
    );
};

const CreativeInventoryPanel: React.FC<{ setGameState: (state: GameState) => void; giveCreativeItem: (item: Item) => void; t: (key: string) => string; language: Language }> = ({ setGameState, giveCreativeItem, t, language }) => {
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center p-4">
            <h2 className="text-4xl font-bold mb-4">{t('inventory')}</h2>
            <div className="w-full max-w-4xl h-[70vh] bg-gray-800 rounded-lg p-4 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                    {CREATIVE_ITEMS.map(item => (
                        <div key={item.id} title={getItemName(item, language)} onClick={() => giveCreativeItem(item)}
                            className="w-20 h-20 bg-gray-700 hover:bg-gray-600 rounded flex flex-col items-center justify-center p-1 cursor-pointer">
                            <span className="text-xs text-center truncate w-full">{getItemName(item, language)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">{t('close')} (Q/Esc)</button>
        </div>
    );
};

const ItemTooltip: React.FC<{item: Item, language: Language, t: (key: string) => string}> = ({item, language, t}) => {
    return (
        <div className="absolute left-full ml-2 w-max p-2 bg-black bg-opacity-80 rounded-lg border border-gray-600 z-50 pointer-events-none">
            <p className={`font-bold text-lg ${item.enchantments && item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(item, language)}</p>
            {item.enchantments && item.enchantments.length > 0 && (
                <div className="text-sm text-purple-300">
                    {item.enchantments.map((ench, index) => (
                        <p key={index}>{language === Language.PT ? ENCHANTMENT_DATA[ench.type].name_pt : ENCHANTMENT_DATA[ench.type].name_en} {ench.level > 1 ? ench.level : ''}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

const InventoryPanel: React.FC<{
    player: Player;
    updatePlayerInventory: (inventory: InventorySlot[], equipment: { weapon: Tool | null, armor: Armor | null, tool: Tool | null, offHand: InventorySlot }, craftingGrid: InventorySlot[], craftingOutput: InventorySlot) => void;
    setGameState: (state: GameState) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, updatePlayerInventory, setGameState, mousePos, t, language }) => {
    type DragSource = { type: 'inventory', index: number } | { type: 'weapon' } | { type: 'armor' } | { type: 'tool' } | { type: 'offHand' } | {type: 'crafting', index: number} | {type: 'output'};
    const [draggedItem, setDraggedItem] = useState<{ item: Item, source: DragSource | 'split' } | null>(null);
    const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
    const itemRef = React.useRef<HTMLDivElement>(null);


    const handleDragStart = (item: Item, source: DragSource) => (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 0) {
            setDraggedItem({ item, source });
        }
    };
    
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== 'e' || !itemRef.current) return;
            const hoveredElement = document.querySelector(".hovered-slot");
            if (!hoveredElement) return;

            const type = hoveredElement.getAttribute('data-type');
            const indexStr = hoveredElement.getAttribute('data-index');
            if(!type || !indexStr) return;

            const index = parseInt(indexStr);
            let item: Item | null = null;
            let source: DragSource | null = null;
            
            if (type === 'inventory') {
                item = player.inventory[index].item;
                source = { type: 'inventory', index };
            } else if (type === 'crafting') {
                item = player.craftingGrid[index].item;
                source = { type: 'crafting', index };
            }

            if (item && source && item.stackable && item.quantity > 1) {
                const half = Math.ceil(item.quantity / 2);
                const newOriginalQuantity = Math.floor(item.quantity / 2);
                
                const newInventory = [...player.inventory];
                const newCraftingGrid = [...player.craftingGrid];

                const updatedItem = { ...item, quantity: newOriginalQuantity };

                if (source.type === 'inventory') {
                    newInventory[source.index] = { item: updatedItem.quantity > 0 ? updatedItem : null };
                } else if (source.type === 'crafting') {
                     newCraftingGrid[source.index] = { item: updatedItem.quantity > 0 ? updatedItem : null };
                }
                
                setDraggedItem({ item: { ...item, quantity: half }, source: 'split' });
                updatePlayerInventory(newInventory, { weapon: player.weapon, armor: player.armor, tool: player.tool, offHand: player.offHand }, newCraftingGrid, player.craftingOutput);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [player, updatePlayerInventory]);
    
    const takeCrafted = () => {
        if (!player.craftingOutput.item || draggedItem) return;
        
        let newInventory = [...player.inventory];
        let quantityLeft = player.craftingOutput.item.quantity;
        const itemToTake = player.craftingOutput.item;
        
         if (itemToTake.stackable) {
            for (let i = 0; i < newInventory.length; i++) {
                const slot = newInventory[i];
                 if(slot.item && slot.item.id === itemToTake.id && slot.item.quantity < itemToTake.maxStack) {
                     const canAdd = itemToTake.maxStack - slot.item.quantity;
                     const toAdd = Math.min(quantityLeft, canAdd);
                     slot.item.quantity += toAdd;
                     quantityLeft -= toAdd;
                 }
                 if(quantityLeft <= 0) break;
            }
        }
        if (quantityLeft > 0) {
            for (let i = 0; i < newInventory.length; i++) {
                 if (!newInventory[i].item) {
                    newInventory[i] = { item: {...itemToTake, quantity: quantityLeft } };
                    quantityLeft = 0;
                    break;
                }
            }
        }
        
        if (quantityLeft === 0) {
             playSound(SOUNDS.CRAFT_SUCCESS);
            const newCraftingGrid = player.craftingGrid.map(slot => {
                if(slot.item) {
                    const newQty = slot.item.quantity - 1;
                    return newQty > 0 ? { item: {...slot.item, quantity: newQty} } : { item: null };
                }
                return { item: null };
            });
            updatePlayerInventory(newInventory, { weapon: player.weapon, armor: player.armor, tool: player.tool, offHand: player.offHand }, newCraftingGrid, { item: null });
        }
    };

    const handleDrop = (target: DragSource) => {
        if (!draggedItem) return;

        const newState = {
            inventory: player.inventory.map(slot => ({ ...slot, item: slot.item ? { ...slot.item } : null })),
            weapon: player.weapon ? { ...player.weapon } : null,
            armor: player.armor ? { ...player.armor } : null,
            tool: player.tool ? { ...player.tool } : null,
            offHand: { ...player.offHand, item: player.offHand.item ? { ...player.offHand.item } : null },
            craftingGrid: player.craftingGrid.map(slot => ({ ...slot, item: slot.item ? { ...slot.item } : null })),
            craftingOutput: { ...player.craftingOutput, item: player.craftingOutput.item ? {...player.craftingOutput.item} : null},
        };

        const getItem = (source: DragSource): InventorySlot => {
            if (source.type === 'inventory') return newState.inventory[source.index];
            if (source.type === 'crafting') return newState.craftingGrid[source.index];
            if (source.type === 'output') return newState.craftingOutput;
            if (source.type === 'offHand') return newState.offHand;
            return {item: newState[source.type]};
        };
        const setItem = (source: DragSource, slot: InventorySlot) => {
            if (source.type === 'inventory') newState.inventory[source.index] = slot;
            else if (source.type === 'crafting') newState.craftingGrid[source.index] = slot;
            else if (source.type === 'output') newState.craftingOutput = slot;
            else if (source.type === 'offHand') newState.offHand = slot;
            else newState[source.type] = slot.item as any;
        };

        // Handle dropping an item that was just split from a stack
        if (draggedItem.source === 'split') {
            const targetSlot = getItem(target);
            const itemToDrop = draggedItem.item;

            // Case 1: Target slot is empty, place the item.
            if (!targetSlot.item) {
                targetSlot.item = itemToDrop;
                setItem(target, targetSlot);
            }
            // Case 2: Target has the same item, stack it.
            else if (targetSlot.item.id === itemToDrop.id && targetSlot.item.stackable) {
                const canAdd = targetSlot.item.maxStack - targetSlot.item.quantity;
                const toAdd = Math.min(itemToDrop.quantity, canAdd);
                targetSlot.item.quantity += toAdd;
                
                const remaining = itemToDrop.quantity - toAdd;
                if (remaining > 0) {
                    // If there's a remainder, try to return it to inventory.
                    const itemToReturn = { ...itemToDrop, quantity: remaining };
                    let returned = false;
                    for (let i = 0; i < newState.inventory.length; i++) {
                        if (!newState.inventory[i].item) {
                            newState.inventory[i].item = itemToReturn;
                            returned = true;
                            break;
                        }
                    }
                    if(!returned) console.log("Inventory full, could not return remainder of split stack.");
                }
            }
            // Case 3: Target has a different item, drop fails. Return the split item to inventory.
            else {
                 let itemToReturn = itemToDrop;
                 let returned = false;
                 // Try to stack with existing items first
                 for (let i = 0; i < newState.inventory.length; i++) {
                    const slot = newState.inventory[i];
                     if (slot.item && slot.item.id === itemToReturn.id && slot.item.quantity < itemToReturn.maxStack) {
                        const canAdd = itemToReturn.maxStack - slot.item.quantity;
                        const toAdd = Math.min(itemToReturn.quantity, canAdd);
                        slot.item.quantity += toAdd;
                        itemToReturn.quantity -= toAdd;
                        if (itemToReturn.quantity <= 0) {
                            returned = true;
                            break;
                        }
                    }
                 }
                 if(itemToReturn.quantity > 0) {
                     for (let i = 0; i < newState.inventory.length; i++) {
                         if (!newState.inventory[i].item) {
                             newState.inventory[i].item = itemToReturn;
                             returned = true;
                             break;
                         }
                     }
                 }
                 if(!returned) console.log("Inventory full, could not return undroppable split stack.");
            }
            
            updatePlayerInventory(newState.inventory, { weapon: newState.weapon, armor: newState.armor, tool: newState.tool, offHand: newState.offHand }, newState.craftingGrid, newState.craftingOutput);
            setDraggedItem(null);
            return; // Exit early
        }

        if (target.type === 'offHand') {
            const item = draggedItem.item;
            if (item.type !== 'shield' && item.type !== 'light_source' && item.type !== 'totem') {
                setDraggedItem(null); // Cancel drop
                return;
            }
        }
        if (draggedItem.source.type === 'offHand') {
            const targetSlot = getItem(target);
            if (targetSlot.item && targetSlot.item.type !== 'shield' && targetSlot.item.type !== 'light_source' && targetSlot.item.type !== 'totem') {
                 setDraggedItem(null); // Cancel drop
                 return;
            }
        }
        

        // Original logic for swapping items between two physical slots
        const sourceSlot = getItem(draggedItem.source);
        const targetSlot = getItem(target);

        if (sourceSlot.item?.id === targetSlot.item?.id && sourceSlot.item?.stackable && targetSlot.item) {
            const canAdd = targetSlot.item.maxStack - targetSlot.item.quantity;
            const toAdd = Math.min(sourceSlot.item.quantity, canAdd);
            targetSlot.item.quantity += toAdd;
            sourceSlot.item.quantity -= toAdd;
            if (sourceSlot.item.quantity <= 0) sourceSlot.item = null;
        } else {
             const temp = sourceSlot.item;
             sourceSlot.item = targetSlot.item;
             targetSlot.item = temp;
        }
        
        setItem(draggedItem.source, sourceSlot);
        setItem(target, targetSlot);

        updatePlayerInventory(newState.inventory, { weapon: newState.weapon, armor: newState.armor, tool: newState.tool, offHand: newState.offHand }, newState.craftingGrid, newState.craftingOutput);
    };

    const handleMouseUp = (target: DragSource) => (e: React.MouseEvent) => {
        if(draggedItem) {
             e.preventDefault();
             handleDrop(target);
        }
        setDraggedItem(null);
    };
    
    const handleHover = (e: React.MouseEvent<HTMLDivElement>) => {
        document.querySelectorAll('.hovered-slot').forEach(el => el.classList.remove('hovered-slot'));
        e.currentTarget.classList.add('hovered-slot');
    }

    const renderSlot = (slot: InventorySlot, index: number, type: 'inventory' | 'crafting' | 'output') => (
        <div
            key={type+index}
            data-type={type}
            data-index={index}
            className={`w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded flex items-center justify-center relative select-none group`}
            onMouseUp={handleMouseUp({ type, index })}
            onClick={type === 'output' ? takeCrafted : undefined}
            onMouseEnter={(e) => { handleHover(e); setHoveredItem(slot.item); }}
            onMouseLeave={() => setHoveredItem(null)}
        >
            {slot.item && (
                <>
                    <div
                        className="w-full h-full flex flex-col items-center justify-center cursor-grab"
                        onMouseDown={handleDragStart(slot.item, { type, index })}
                    >
                        <span className={`text-xs text-center truncate w-full ${slot.item.enchantments && slot.item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(slot.item, language)}</span>
                        <span className="text-lg font-bold">{slot.item.quantity}</span>
                    </div>
                    {slot.item.durability !== undefined && slot.item.maxDurability !== undefined && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10/12 h-1.5 bg-gray-900 rounded-full">
                            <div
                                className={`h-full rounded-full ${getDurabilityColor(slot.item.durability, slot.item.maxDurability)}`}
                                style={{ width: `${(slot.item.durability / slot.item.maxDurability) * 100}%` }}
                            ></div>
                        </div>
                    )}
                    <div className="hidden group-hover:block">
                        <ItemTooltip item={slot.item} language={language} t={t} />
                    </div>
                </>
            )}
        </div>
    );
    
    const renderEquipmentSlot = (item: Item | null, type: 'weapon' | 'armor' | 'tool' | 'offHand', placeholder: string) => (
      <div
        key={type}
        className="w-20 h-20 bg-gray-700 border-2 border-dashed border-gray-500 rounded flex items-center justify-center relative select-none group"
        onMouseUp={handleMouseUp({ type })}
        onMouseEnter={() => setHoveredItem(item)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {item ? (
          <>
            <div
              className="w-full h-full flex flex-col items-center justify-center cursor-grab"
              onMouseDown={handleDragStart(item, { type })}
            >
              <span className={`text-xs text-center truncate w-full ${item.enchantments && item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(item, language)}</span>
            </div>
             {item.durability !== undefined && item.maxDurability !== undefined && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10/12 h-1.5 bg-gray-900 rounded-full">
                    <div
                        className={`h-full rounded-full ${getDurabilityColor(item.durability, item.maxDurability)}`}
                        style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                    ></div>
                </div>
            )}
            <div className="hidden group-hover:block">
               {item && <ItemTooltip item={item} language={language} t={t} />}
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>
    );

    return (
        <div ref={itemRef} className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center" onMouseUp={() => setDraggedItem(null)}>
             <div className="flex gap-8 p-4 bg-gray-800 rounded-lg border-2 border-gray-600">
                <div className="flex flex-col gap-4">
                    {renderEquipmentSlot(player.weapon, 'weapon', t('weapon'))}
                    {renderEquipmentSlot(player.armor, 'armor', t('armor'))}
                    {renderEquipmentSlot(player.tool, 'tool', t('tool'))}
                    {renderEquipmentSlot(player.offHand.item, 'offHand', t('offHand'))}
                </div>
                <div className="text-center">
                     <h2 className="text-2xl mb-2">{t('inventory')}</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.map((slot, index) => renderSlot(slot, index, 'inventory'))}
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-xl mb-2">{t('crafting')}</h2>
                    <div className="grid grid-cols-2 gap-2">
                         {player.craftingGrid.map((slot, index) => renderSlot(slot, index, 'crafting'))}
                    </div>
                    <div className="mt-4 flex justify-center items-center">
                        <span className="text-2xl mr-2">→</span>
                        {renderSlot(player.craftingOutput, 0, 'output')}
                    </div>
                </div>
            </div>
             {draggedItem && (
                <div className="fixed pointer-events-none top-0 left-0" style={{ transform: `translate(${mousePos.x - 32}px, ${mousePos.y-32}px)` }}>
                    <div className="w-16 h-16 bg-gray-600 border-2 border-yellow-400 rounded flex flex-col items-center justify-center opacity-75">
                         <span className={`text-xs text-center truncate w-full ${draggedItem.item.enchantments && draggedItem.item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(draggedItem.item, language)}</span>
                        <span className="text-lg font-bold">{draggedItem.item.quantity}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChestPanel: React.FC<{
    player: Player;
    activeChest: Building;
    updatePlayerAndChestInventories: (playerInv: InventorySlot[], chestId: string, chestInv: InventorySlot[]) => void;
    setGameState: (state: GameState) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, activeChest, updatePlayerAndChestInventories, setGameState, mousePos, t, language }) => {
    type DragSource = { type: 'inventory', index: number } | { type: 'chest', index: number };
    const [draggedItem, setDraggedItem] = useState<{ item: Item, source: DragSource } | null>(null);

    const handleDragStart = (item: Item, source: DragSource) => (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 0) {
            setDraggedItem({ item, source });
        }
    };

    const handleDrop = (target: DragSource) => {
        if (!draggedItem) return;

        let newPlayerInv = player.inventory.map(slot => ({...slot, item: slot.item ? {...slot.item} : null}));
        let newChestInv = (activeChest.inventory || []).map(slot => ({...slot, item: slot.item ? {...slot.item} : null}));

        const getSlot = (source: DragSource) => source.type === 'inventory' ? newPlayerInv[source.index] : newChestInv[source.index];
        const setSlot = (source: DragSource, slot: InventorySlot) => {
             if(source.type === 'inventory') newPlayerInv[source.index] = slot;
             else newChestInv[source.index] = slot;
        }

        const sourceSlot = getSlot(draggedItem.source);
        const targetSlot = getSlot(target);

        if (sourceSlot.item && sourceSlot.item.id === targetSlot.item?.id && sourceSlot.item.stackable && targetSlot.item.quantity < targetSlot.item.maxStack) {
             const canAdd = targetSlot.item.maxStack - targetSlot.item.quantity;
             const toAdd = Math.min(sourceSlot.item.quantity, canAdd);
             targetSlot.item.quantity += toAdd;
             sourceSlot.item.quantity -= toAdd;
             if(sourceSlot.item.quantity <= 0) {
                sourceSlot.item = null;
             }
        } else {
             const temp = sourceSlot.item;
             sourceSlot.item = targetSlot.item;
             targetSlot.item = temp;
        }
        
        setSlot(draggedItem.source, sourceSlot);
        setSlot(target, targetSlot);

        updatePlayerAndChestInventories(newPlayerInv, activeChest.id, newChestInv);
    };

     const handleMouseUp = (target: DragSource) => (e: React.MouseEvent) => {
        if(draggedItem) {
             e.preventDefault();
             handleDrop(target);
        }
        setDraggedItem(null);
    };

    const renderSlot = (slot: InventorySlot, index: number, type: 'inventory' | 'chest') => (
        <div
            key={`${type}-${index}`}
            className={`w-16 h-16 bg-gray-700 border-2 rounded flex items-center justify-center relative select-none group ${type === 'chest' ? 'border-yellow-700' : 'border-gray-600'}`}
            onMouseUp={handleMouseUp({ type, index })}
        >
            {slot.item && (
                 <>
                    <div className="w-full h-full flex flex-col items-center justify-center cursor-grab" onMouseDown={handleDragStart(slot.item, { type, index })}>
                        <span className="text-xs text-center truncate w-full">{getItemName(slot.item, language)}</span>
                        <span className="text-lg font-bold">{slot.item.quantity}</span>
                    </div>
                    {slot.item.durability !== undefined && slot.item.maxDurability !== undefined && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10/12 h-1.5 bg-gray-900 rounded-full">
                            <div
                                className={`h-full rounded-full ${getDurabilityColor(slot.item.durability, slot.item.maxDurability)}`}
                                style={{ width: `${(slot.item.durability / slot.item.maxDurability) * 100}%` }}
                            ></div>
                        </div>
                    )}
                    <div className="hidden group-hover:block">
                        <ItemTooltip item={slot.item} language={language} t={t} />
                    </div>
                </>
            )}
        </div>
    );
    
    return (
         <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white" onMouseUp={() => setDraggedItem(null)}>
            <div className="flex gap-8 p-4 bg-gray-800 rounded-lg border-2 border-gray-600">
                 <div className="text-center">
                     <h2 className="text-2xl mb-2">{t('inventory')}</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.map((slot, index) => renderSlot(slot, index, 'inventory'))}
                    </div>
                </div>
                 <div className="text-center">
                    <h2 className="text-2xl mb-2">{t('chest')}</h2>
                    <div className="grid grid-cols-4 gap-2">
                         {(activeChest.inventory || []).map((slot, index) => renderSlot(slot, index, 'chest'))}
                    </div>
                </div>
            </div>
             <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                {t('close')} (Q/Esc)
            </button>
             {draggedItem && (
                <div className="fixed pointer-events-none top-0 left-0" style={{ transform: `translate(${mousePos.x - 32}px, ${mousePos.y-32}px)` }}>
                    <div className="w-16 h-16 bg-gray-600 border-2 border-yellow-400 rounded flex flex-col items-center justify-center opacity-75">
                         <span className="text-xs text-center truncate w-full">{getItemName(draggedItem.item, language)}</span>
                        <span className="text-lg font-bold">{draggedItem.item.quantity}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

const PortalPanel: React.FC<{
    player: Player;
    activePortal: Portal;
    updatePlayerAndPortalInventories: (playerInv: InventorySlot[], portalId: string, portalInv: InventorySlot[]) => void;
    enterRubyDimension: () => void;
    setGameState: (state: GameState) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, activePortal, updatePlayerAndPortalInventories, enterRubyDimension, setGameState, mousePos, t, language }) => {
    type DragSource = { type: 'inventory', index: number } | { type: 'portal', index: number };
    const [draggedItem, setDraggedItem] = useState<{ item: Item, source: DragSource } | null>(null);
    const [isActivated, setIsActivated] = useState(false);

    useEffect(() => {
        const counts: {[key: string]: number} = {};
        activePortal.inventory.forEach(slot => {
            if (slot.item) {
                counts[slot.item.id] = (counts[slot.item.id] || 0) + slot.item.quantity;
            }
        });

        const requirementsMet = Object.entries(PORTAL_REQUIREMENTS).every(([itemId, requiredAmount]) => {
            return (counts[itemId] || 0) >= requiredAmount;
        });

        if (requirementsMet && !isActivated) {
            playSound(SOUNDS.PORTAL_ACTIVATE);
        }
        setIsActivated(requirementsMet);
    }, [activePortal.inventory, isActivated]);

    const handleDragStart = (item: Item, source: DragSource) => (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 0) {
            setDraggedItem({ item, source });
        }
    };

    const handleDrop = (target: DragSource) => {
        if (!draggedItem) return;

        let newPlayerInv = player.inventory.map(slot => ({...slot, item: slot.item ? {...slot.item} : null}));
        let newPortalInv = activePortal.inventory.map(slot => ({...slot, item: slot.item ? {...slot.item} : null}));

        const sourceItem = draggedItem.source.type === 'inventory' 
            ? newPlayerInv[draggedItem.source.index].item
            : newPortalInv[draggedItem.source.index].item;

        const targetItem = target.type === 'inventory'
            ? newPlayerInv[target.index].item
            : newPortalInv[target.index].item;

        if (sourceItem && sourceItem.id === targetItem?.id && sourceItem.stackable && targetItem.quantity < targetItem.maxStack) {
             const canAdd = targetItem.maxStack - targetItem.quantity;
             const toAdd = Math.min(sourceItem.quantity, canAdd);
             targetItem.quantity += toAdd;
             sourceItem.quantity -= toAdd;
             if(sourceItem.quantity <= 0) {
                if (draggedItem.source.type === 'inventory') newPlayerInv[draggedItem.source.index].item = null;
                else newPortalInv[draggedItem.source.index].item = null;
             }
        } else {
             if (draggedItem.source.type === 'inventory') newPlayerInv[draggedItem.source.index].item = targetItem;
             else newPortalInv[draggedItem.source.index].item = targetItem;

             if (target.type === 'inventory') newPlayerInv[target.index].item = sourceItem;
             else newPortalInv[target.index].item = sourceItem;
        }

        updatePlayerAndPortalInventories(newPlayerInv, activePortal.id, newPortalInv);
    };

     const handleMouseUp = (target: DragSource) => (e: React.MouseEvent) => {
        if(draggedItem) {
             e.preventDefault();
             handleDrop(target);
        }
        setDraggedItem(null);
    };

    const renderSlot = (slot: InventorySlot, index: number, type: 'inventory' | 'portal') => (
        <div
            key={`${type}-${index}`}
            className={`w-16 h-16 bg-gray-700 border-2 rounded flex items-center justify-center relative select-none group ${type === 'portal' ? 'border-purple-500' : 'border-gray-600'}`}
            onMouseUp={handleMouseUp({ type, index })}
        >
            {slot.item && (
                <div className="w-full h-full flex flex-col items-center justify-center cursor-grab" onMouseDown={handleDragStart(slot.item, { type, index })}>
                    <span className="text-xs text-center truncate w-full">{getItemName(slot.item, language)}</span>
                    <span className="text-lg font-bold">{slot.item.quantity}</span>
                </div>
            )}
            {slot.item && (
                 <div className="hidden group-hover:block">
                    <ItemTooltip item={slot.item} language={language} t={t} />
                </div>
            )}
        </div>
    );
    
    return (
         <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white" onMouseUp={() => setDraggedItem(null)}>
            {isActivated && (
                <button onClick={enterRubyDimension} className="absolute top-1/4 bg-purple-600 hover:bg-purple-700 font-bold py-3 px-6 rounded-lg text-xl animate-pulse">
                    {t('enterDimension')}
                </button>
            )}
            <div className="flex gap-8 p-4 bg-gray-800 rounded-lg border-2 border-gray-600">
                 <div className="text-center">
                     <h2 className="text-2xl mb-2">{t('inventory')}</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.map((slot, index) => renderSlot(slot, index, 'inventory'))}
                    </div>
                </div>
                 <div className="text-center">
                    <h2 className="text-2xl mb-2">{t('portalInventory')}</h2>
                    <div className="grid grid-cols-5 gap-2">
                         {activePortal.inventory.map((slot, index) => renderSlot(slot, index, 'portal'))}
                    </div>
                </div>
            </div>
             <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                {t('close')} (Q/Esc)
            </button>
             {draggedItem && (
                <div className="fixed pointer-events-none top-0 left-0" style={{ transform: `translate(${mousePos.x - 32}px, ${mousePos.y-32}px)` }}>
                    <div className="w-16 h-16 bg-gray-600 border-2 border-yellow-400 rounded flex flex-col items-center justify-center opacity-75">
                         <span className="text-xs text-center truncate w-full">{getItemName(draggedItem.item, language)}</span>
                        <span className="text-lg font-bold">{draggedItem.item.quantity}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

const ShopPanel: React.FC<{ setGameState: (state: GameState) => void; player: Player; addToInventory: (item: any, quantity?: number) => boolean; t: (key: string) => string; language: Language; }> = ({ setGameState, player, addToInventory, t, language }) => {
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold mb-4">{t('shop')}</h2>
            <div className="w-full max-w-2xl h-[60vh] bg-gray-800 p-4 rounded-lg overflow-y-auto">
                {/* DEPRECATED */}
            </div>
            <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                {t('close')}
            </button>
        </div>
    );
};

const WorkbenchPanel: React.FC<{
    player: Player;
    handleCraft: (itemId: string) => void;
    setGameState: (state: GameState) => void;
    t: (key: string) => string;
    language: Language;
}> = ({ player, handleCraft, setGameState, t, language }) => {
    const resourceCounts = useMemo(() => {
        const counts: { [key: string]: number } = { 'ammo': player.ammo };
        player.inventory.forEach(slot => {
            if (slot.item) {
                counts[slot.item.id] = (counts[slot.item.id] || 0) + slot.item.quantity;
            }
        });
        return counts;
    }, [player.inventory, player.ammo]);

    const canCraft = (itemId: string) => {
        const recipe = CRAFTING_RECIPES[itemId];
        if (!recipe) return false;
        return Object.entries(recipe).every(([resourceId, requiredAmount]) => 
            (resourceCounts[resourceId] || 0) >= requiredAmount
        );
    };
    
    const craftableItems = Object.keys(CRAFTING_RECIPES);

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center p-4">
            <h2 className="text-4xl font-bold mb-4">{t('workbench')}</h2>
            <div className="w-full max-w-6xl h-[70vh] flex gap-8">
                {/* Left side: Inventory */}
                <div className="w-2/5 bg-gray-800 rounded-lg p-4 overflow-y-auto">
                    <h3 className="text-2xl mb-2 text-center">{t('inventory')}</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.map((slot, index) => (
                            <div key={index} className="w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded flex items-center justify-center relative select-none group">
                                {slot.item && (
                                    <>
                                    <div className="w-full h-full flex flex-col items-center justify-center p-1">
                                        <span className='text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full text-center' title={getItemName(slot.item, language)}>{getItemName(slot.item, language)}</span>
                                        <span className='text-lg font-bold'>{slot.item.quantity}</span>
                                    </div>
                                    <div className="hidden group-hover:block">
                                        <ItemTooltip item={slot.item} language={language} t={t} />
                                    </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side: Recipes */}
                <div className="w-3/5 bg-gray-800 rounded-lg p-4 overflow-y-auto">
                     <h3 className="text-2xl mb-2 text-center">{t('craftableItems')}</h3>
                    {craftableItems.map(itemId => {
                        const item = ITEMS[itemId];
                        const recipe = CRAFTING_RECIPES[itemId];
                        const hasResources = canCraft(itemId);
                        if (!item || !recipe) return null;
                        
                        const isAmmo = itemId === 'ammo';
                        let resultString = getItemName(item, language);
                        if (isAmmo) resultString = `30x ${resultString}`;
                        if (itemId === 'arrow') resultString = `4x ${resultString}`;

                        return (
                            <div key={itemId} className={`flex justify-between items-center p-2 my-1 rounded ${hasResources ? 'bg-gray-700' : 'bg-gray-800 opacity-50'}`}>
                               <div>
                                    <p className="font-bold text-lg">{resultString}</p>
                                    <p className="text-xs text-gray-400">
                                        {Object.entries(recipe).map(([reqId, reqQty]) => `${reqQty}x ${getItemName(ITEMS[reqId], language) || reqId}`).join(', ')}
                                    </p>
                               </div>
                               <button 
                                    onClick={() => handleCraft(itemId)} 
                                    disabled={!hasResources}
                                    className={`px-4 py-2 rounded font-bold ${hasResources ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}
                                >
                                   {t('craft')}
                               </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">{t('close')}</button>
        </div>
    );
};

const FurnacePanel: React.FC<{
    player: Player;
    activeFurnace: Building;
    updatePlayerAndFurnaceInventories: (playerInv: InventorySlot[], furnaceId: string, furnaceInv: InventorySlot[]) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, activeFurnace, updatePlayerAndFurnaceInventories, mousePos, t, language }) => {
    type DragSource = { type: 'inventory', index: number } | { type: 'furnace', index: number };
    const [dragged, setDragged] = useState<{ item: Item, source: DragSource } | null>(null);

    const furnaceSlots = activeFurnace.inventory || [];
    const inputSlot = furnaceSlots[0];
    const fuelSlot = furnaceSlots[1];
    const outputSlot = furnaceSlots[2];

    const handleDragStart = (item: Item, source: DragSource) => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragged({ item, source });
    };

    const handleDrop = (target: DragSource) => {
        if (!dragged) return;

        let newPlayerInv = player.inventory.map(s => ({...s}));
        let newFurnaceInv = furnaceSlots.map(s => ({...s}));

        const getSlot = (source: DragSource) => source.type === 'inventory' ? newPlayerInv[source.index] : newFurnaceInv[source.index];
        const setSlot = (source: DragSource, slot: InventorySlot) => {
             if(source.type === 'inventory') newPlayerInv[source.index] = slot;
             else newFurnaceInv[source.index] = slot;
        }

        const sourceSlot = getSlot(dragged.source);
        const targetSlot = getSlot(target);
        
        // Validation
        if(target.type === 'furnace') {
            if(target.index === 0 && !dragged.item.smeltResult) { setDragged(null); return; }
            if(target.index === 1 && !dragged.item.fuelTime) { setDragged(null); return; }
            if(target.index === 2) { // Can't place into output slot
                 if(dragged.source.type === 'furnace' && dragged.source.index === 2){
                    // allow taking from output
                 } else {
                    setDragged(null); return;
                 }
            }
        }
        if (dragged.source.type === 'furnace' && dragged.source.index === 2 && target.type === 'furnace' && target.index !== 2){
            setDragged(null); return; // can't move output back into furnace
        }
        

        if (sourceSlot.item?.id === targetSlot.item?.id && sourceSlot.item?.stackable && targetSlot.item?.quantity < targetSlot.item.maxStack) {
             const canAdd = targetSlot.item.maxStack - targetSlot.item.quantity;
             const toAdd = Math.min(sourceSlot.item.quantity, canAdd);
             targetSlot.item.quantity += toAdd;
             sourceSlot.item.quantity -= toAdd;
             if(sourceSlot.item.quantity <= 0) sourceSlot.item = null;
        } else {
             const temp = sourceSlot.item;
             sourceSlot.item = targetSlot.item;
             targetSlot.item = temp;
        }

        setSlot(dragged.source, sourceSlot);
        setSlot(target, targetSlot);

        updatePlayerAndFurnaceInventories(newPlayerInv, activeFurnace.id, newFurnaceInv);
    };

    const handleMouseUp = (target: DragSource) => () => {
        if (dragged) handleDrop(target);
        setDragged(null);
    };
    
    const renderSlot = (slot: InventorySlot, index: number, type: 'inventory' | 'furnace') => (
         <div key={`${type}-${index}`} className="w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded flex items-center justify-center relative select-none group" onMouseUp={handleMouseUp({ type, index })}>
            {slot.item && (
                <>
                 <div className="w-full h-full flex flex-col items-center justify-center cursor-grab" onMouseDown={handleDragStart(slot.item, { type, index })}>
                    <span className="text-xs text-center truncate w-full">{getItemName(slot.item, language)}</span>
                    <span className="text-lg font-bold">{slot.item.quantity}</span>
                </div>
                 <div className="hidden group-hover:block">
                    <ItemTooltip item={slot.item} language={language} t={t} />
                </div>
                </>
            )}
        </div>
    );
    
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white" onMouseUp={() => setDragged(null)}>
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600">
                <h2 className="text-3xl font-bold mb-4 text-center">{t('furnace')}</h2>
                <div className="flex gap-8 items-center">
                    {/* Furnace UI */}
                    <div className="flex flex-col items-center gap-2">
                        <p>{t('input')}</p>
                        {renderSlot(inputSlot, 0, 'furnace')}
                        <p>{t('fuel')}</p>
                        {renderSlot(fuelSlot, 1, 'furnace')}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-4 bg-gray-600 rounded">
                             <div className="h-full bg-orange-500 rounded" style={{width: `${(activeFurnace.smeltProgress || 0) / SMELT_TIME * 100}%`}}></div>
                        </div>
                         <div className="w-12 h-16 bg-gray-600 rounded relative overflow-hidden">
                             <div className="absolute bottom-0 w-full bg-red-600" style={{height: `${(activeFurnace.fuelLeft || 0) / (FUEL_DURATION[fuelSlot?.item?.id || 'coal'] || 1) * 100}%`}}></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <p>{t('output')}</p>
                        {renderSlot(outputSlot, 2, 'furnace')}
                    </div>
                    
                     {/* Player Inventory */}
                    <div>
                         <h3 className="text-xl mb-2 text-center">{t('inventory')}</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {player.inventory.map((slot, i) => renderSlot(slot, i, 'inventory'))}
                        </div>
                    </div>
                </div>
            </div>
            {dragged && (
                <div className="fixed pointer-events-none top-0 left-0" style={{ transform: `translate(${mousePos.x - 32}px, ${mousePos.y-32}px)` }}>
                    <div className="w-16 h-16 bg-gray-600 border-2 border-yellow-400 rounded flex flex-col items-center justify-center opacity-75">
                         <span className="text-xs text-center truncate w-full">{getItemName(dragged.item, language)}</span>
                        <span className="text-lg font-bold">{dragged.item.quantity}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const VendorShopPanel: React.FC<{
    player: Player;
    activeNPC: NPC;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addToInventory: (item: any, quantity?: number) => boolean;
    setGameState: (state: GameState) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, activeNPC, setPlayer, addToInventory, setGameState, mousePos, t, language }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());
    const discount = player.vendorDiscount;

    useEffect(() => {
        if (discount) {
            const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
            return () => clearInterval(interval);
        }
    }, [discount]);

    const handleBuy = (itemId: string, price: number, quantity: number = 1) => {
        if (player.money >= price) {
            playSound(SOUNDS.BUY_ITEM);
            const itemProto = ITEMS[itemId];
            if(itemProto){
                const purchased = addToInventory(itemProto, quantity);
                if(purchased) {
                     setPlayer(p => ({...p, money: p.money - price}));
                }
            }
        }
    };
    
    const renderVendorItem = (itemId: string, data: { price: number }) => {
        const item = ITEMS[itemId];
        if (!item) return null;
        let buyQuantity = 1;
        if(['arrow', 'cooked_meat'].includes(itemId)) buyQuantity = 10;
        if(['ammo'].includes(itemId)) buyQuantity = 50;
        if(['refined_wood', 'stone'].includes(itemId)) buyQuantity = 32;
        if(['iron_ingot'].includes(itemId)) buyQuantity = 16;
        
        const currentDiscount = (discount && discount.endTime > currentTime) ? discount.factor : 0;
        const finalPrice = Math.round(data.price * (1 - currentDiscount));

        return (
            <div key={itemId} className="flex justify-between items-center p-2 my-1 rounded bg-gray-700">
                <div>
                    <p className="font-bold text-lg">{buyQuantity > 1 ? `${buyQuantity}x ` : ''}{getItemName(item, language)}</p>
                    {currentDiscount > 0 ? (
                        <p className="text-sm">
                            <span className="text-green-400 font-bold">${finalPrice}</span>
                            <span className="text-gray-500 line-through ml-2">${data.price}</span>
                        </p>
                    ) : (
                        <p className="text-sm text-yellow-400">${data.price}</p>
                    )}
                </div>
                <button
                    onClick={() => handleBuy(itemId, finalPrice, buyQuantity)}
                    disabled={player.money < finalPrice}
                    className="px-4 py-2 rounded font-bold bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {t('buy')}
                </button>
            </div>
        );
    };
    
    const renderPlayerSlot = (slot: InventorySlot, index: number) => (
         <div key={`inv-${index}`} className="w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded flex items-center justify-center relative select-none group">
            {slot.item && (
                <>
                 <div className="w-full h-full flex flex-col items-center justify-center p-1">
                    <span className='text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full text-center' title={getItemName(slot.item, language)}>{getItemName(slot.item, language)}</span>
                    <span className='text-lg font-bold'>{slot.item.quantity}</span>
                </div>
                 <div className="hidden group-hover:block">
                    <ItemTooltip item={slot.item} language={language} t={t} />
                </div>
                </>
            )}
        </div>
    );

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white">
            <div className="w-full max-w-4xl h-[80vh] flex gap-8 p-4 bg-gray-800 rounded-lg border-2 border-gray-600">
                {/* Left side: Vendor's Items */}
                <div className="w-1/2 overflow-y-auto">
                    <h2 className="text-2xl mb-2 text-center">{language === Language.PT ? translations[language].claudio : translations[language].hitler}'s Shop</h2>
                     {discount && discount.endTime > currentTime && (
                        <div className="p-2 mb-2 bg-green-800 border border-green-600 rounded-lg text-center">
                            <p className="font-bold">Potion Discount Active!</p>
                            <p>10% off for {Math.ceil((discount.endTime - currentTime) / 1000)}s</p>
                        </div>
                     )}
                    {Object.entries(VENDOR_ITEMS).map(([itemId, data]) => renderVendorItem(itemId, data))}
                </div>
                {/* Right side: Player's Inventory */}
                <div className="w-1/2">
                    <h2 className="text-2xl mb-2 text-center">{t('inventory')}</h2>
                    <p className="text-center text-yellow-400 mb-2">{t('yourCoins')}: {player.money}</p>
                    <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[calc(80vh-100px)]">
                        {player.inventory.map(renderPlayerSlot)}
                    </div>
                </div>
            </div>
            <button onClick={() => { playSound(SOUNDS.UI_CLICK); setGameState(GameState.PLAYING); }} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                {t('close')} (Q/Esc)
            </button>
        </div>
    );
};

const NamingPetPanel: React.FC<{
    dogId: string;
    handleNamePet: (dogId: string, name: string) => void;
    t: (key: string) => string;
}> = ({ dogId, handleNamePet, t }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            handleNamePet(dogId, name.trim());
        }
    };

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600">
                <h2 className="text-2xl font-bold mb-4">{t('nameYourPet')}</h2>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={15}
                    className="w-full bg-gray-700 text-white p-2 rounded mb-4"
                    autoFocus
                />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold py-2 px-4 rounded">
                    {t('namePet')}
                </button>
            </form>
        </div>
    );
};

const QuestPanel: React.FC<{
    player: Player;
    activeNPC: NPC;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    setGameState: (state: GameState) => void;
    t: (key: string) => string;
    language: Language;
}> = ({ player, activeNPC, setPlayer, setGameState, t, language }) => {
    const [quest, setQuest] = useState<Quest | null>(null);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

    useEffect(() => {
        if (!player.activeQuest) {
            // Simple logic: offer a random quest the player doesn't have.
            const availableQuests = QUEST_LIST.filter(q => q.id !== player.activeQuest?.id);
            setQuest(availableQuests[Math.floor(Math.random() * availableQuests.length)]);
        }
    }, [player.activeQuest]);

    const acceptQuest = () => {
        if (quest) {
            playSound(SOUNDS.UI_CLICK);
            setPlayer(p => ({ ...p, activeQuest: quest }));
            setGameState(GameState.PLAYING);
        }
    };

    const declineQuest = () => {
        playSound(SOUNDS.UI_CLOSE);
        setGameState(GameState.PLAYING);
    };

    const completeQuest = () => {
        if (!player.activeQuest) return;

        playSound(SOUNDS.QUEST_COMPLETE);
        const reward = Math.floor(Math.random() * (player.activeQuest.rewardMax - player.activeQuest.rewardMin + 1)) + player.activeQuest.rewardMin;
        
        setPlayer(p => {
            let required = p.activeQuest!.requiredAmount;
            const newInventory = p.inventory.map(slot => {
                if(required > 0 && slot.item?.id === p.activeQuest!.itemId) {
                    const toTake = Math.min(required, slot.item.quantity);
                    slot.item.quantity -= toTake;
                    required -= toTake;
                    if (slot.item.quantity <= 0) slot.item = null;
                }
                return slot;
            });
            
            return {
                ...p,
                money: p.money + reward,
                inventory: newInventory,
                activeQuest: null,
            };
        });

        setShowCompleteConfirm(false);
        setGameState(GameState.PLAYING);
    };

    const hasRequiredItems = () => {
        if (!player.activeQuest) return false;
        let count = 0;
        for (const slot of player.inventory) {
            if (slot.item?.id === player.activeQuest.itemId) {
                count += slot.item.quantity;
            }
        }
        return count >= player.activeQuest.requiredAmount;
    };

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white">
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600 max-w-lg text-center">
                <h2 className="text-3xl font-bold mb-4">{activeNPC.name}</h2>
                {player.activeQuest ? (
                    <div>
                        <h3 className="text-xl mb-2">{t('mission')}</h3>
                        <p className="mb-4">{language === Language.PT ? player.activeQuest.description_pt : player.activeQuest.description_en}</p>
                        {showCompleteConfirm ? (
                             <div>
                                <p className="font-bold mb-4">{t('handOverItems')}</p>
                                <div className="flex justify-center gap-4">
                                     <button onClick={completeQuest} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded">{t('yes')}</button>
                                     <button onClick={() => setShowCompleteConfirm(false)} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded">{t('no')}</button>
                                </div>
                            </div>
                        ) : (
                             <button
                                disabled={!hasRequiredItems()}
                                onClick={() => setShowCompleteConfirm(true)}
                                className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {t('completeQuest')}
                            </button>
                        )}
                    </div>
                ) : quest ? (
                    <div>
                        <p className="mb-4">{language === Language.PT ? quest.description_pt : quest.description_en}</p>
                        <p className="text-yellow-400 mb-4">{t('reward')}: ${quest.rewardMin}-${quest.rewardMax}</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={acceptQuest} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded">{t('accept')}</button>
                            <button onClick={declineQuest} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded">{t('decline')}</button>
                        </div>
                    </div>
                ) : (
                    <p>I have no more quests for you right now.</p>
                )}
            </div>
        </div>
    );
};

const SleepConfirmPanel: React.FC<{ skipNight: () => void; setShowSleepConfirm: (show: boolean) => void; t: (key: string) => string; }> = ({ skipNight, setShowSleepConfirm, t }) => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-xl mb-4">{t('skipNight')}</p>
                <div className="flex gap-4">
                    <button onClick={skipNight} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded">{t('yes')}</button>
                    <button onClick={() => setShowSleepConfirm(false)} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded">{t('no')}</button>
                </div>
            </div>
        </div>
    );
};

// FIX: Added 'activeEnchantingTable' to props destructuring to fix scope issue and compilation error.
const EnchantingPanel: React.FC<{
    player: Player;
    activeEnchantingTable: Building;
    updatePlayerAndEnchantingSlots: (playerInv: InventorySlot[], enchantingSlots: InventorySlot[]) => void;
    enchantmentOptions: EnchantmentOption[];
    setEnchantmentOptions: React.Dispatch<React.SetStateAction<EnchantmentOption[]>>;
    handleEnchant: (enchantment: ItemEnchantment) => void;
    mousePos: { x: number; y: number };
    t: (key: string) => string;
    language: Language;
}> = ({ player, activeEnchantingTable, updatePlayerAndEnchantingSlots, enchantmentOptions, setEnchantmentOptions, handleEnchant, mousePos, t, language }) => {
    type DragSource = { type: 'inventory', index: number } | { type: 'enchanting', index: number };
    const [dragged, setDragged] = useState<{ item: Item, source: DragSource } | null>(null);

    const itemSlot = player.enchantingSlots[0];
    const crystalSlot = player.enchantingSlots[1];

    useEffect(() => {
        const item = itemSlot?.item;
        const crystal = crystalSlot?.item;
        if (item && crystal?.id === 'ruby_crystal') {
            const applicableEnchants = Object.entries(ENCHANTMENT_DATA).filter(([key, data]) => {
                const tool = item as Tool;
                if(data.applicableTo.includes('any')) return true;
                if(tool.toolType && data.applicableTo.includes('pickaxe') && tool.toolType === 'pickaxe') return true;
                if(tool.toolType && data.applicableTo.includes('sword') && tool.toolType === 'sword') return true;
                if(item.type === 'armor' && data.applicableTo.includes('armor')) return true;
                if(tool.toolType && ['bow', 'pistol', 'rifle', 'ak47', 'bazooka'].includes(tool.toolType) && data.applicableTo.includes('ranged')) return true;
                return false;
            });
            
            const options: EnchantmentOption[] = [];
            // Simple logic for now: offer 3 random applicable enchants
            for (let i = 0; i < 3 && applicableEnchants.length > 0; i++) {
                const [key, data] = applicableEnchants.splice(Math.floor(Math.random() * applicableEnchants.length), 1)[0];
                const existingEnchant = item.enchantments?.find(e => e.type === key as Enchantment);
                const currentLevel = existingEnchant?.level || 0;
                if (currentLevel < data.maxLevel) {
                    options.push({
                        enchantment: { type: key as Enchantment, level: currentLevel + 1 },
                        description: `${language === Language.PT ? data.name_pt : data.name_en} ${currentLevel + 1}`
                    });
                }
            }
            setEnchantmentOptions(options);

        } else {
            setEnchantmentOptions([]);
        }

    }, [itemSlot, crystalSlot, setEnchantmentOptions, language]);

    const handleDragStart = (item: Item, source: DragSource) => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragged({ item, source });
    };

    const handleDrop = (target: DragSource) => {
        if (!dragged) return;

        let newPlayerInv = player.inventory.map(s => ({...s, item: s.item ? {...s.item} : null}));
        let newEnchantingSlots = player.enchantingSlots.map(s => ({...s, item: s.item ? {...s.item} : null}));

        const getSlot = (source: DragSource) => source.type === 'inventory' ? newPlayerInv[source.index] : newEnchantingSlots[source.index];
        const setSlot = (source: DragSource, slot: InventorySlot) => {
             if(source.type === 'inventory') newPlayerInv[source.index] = slot;
             else newEnchantingSlots[source.index] = slot;
        }

        const sourceSlot = getSlot(dragged.source);
        const targetSlot = getSlot(target);
        
        // Validation for enchanting slots
        if (target.type === 'enchanting') {
            if (target.index === 1 && dragged.item.id !== 'ruby_crystal') {
                setDragged(null);
                return;
            }
            if (target.index === 0 && (!dragged.item.maxDurability)) {
                setDragged(null);
                return;
            }
        }
        
        if (sourceSlot.item?.id === targetSlot.item?.id && sourceSlot.item?.stackable && targetSlot.item?.quantity < targetSlot.item.maxStack) {
             const canAdd = targetSlot.item.maxStack - targetSlot.item.quantity;
             const toAdd = Math.min(sourceSlot.item.quantity, canAdd);
             targetSlot.item.quantity += toAdd;
             sourceSlot.item.quantity -= toAdd;
             if(sourceSlot.item.quantity <= 0) sourceSlot.item = null;
        } else {
             const temp = sourceSlot.item;
             sourceSlot.item = targetSlot.item;
             targetSlot.item = temp;
        }

        setSlot(dragged.source, sourceSlot);
        setSlot(target, targetSlot);

        updatePlayerAndEnchantingSlots(newPlayerInv, newEnchantingSlots);
    };

    const handleMouseUp = (target: DragSource) => () => {
        if (dragged) handleDrop(target);
        setDragged(null);
    };

    const renderSlot = (slot: InventorySlot, index: number, type: 'inventory' | 'enchanting', placeholder: string = "") => (
         <div key={`${type}-${index}`} className="w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded flex flex-col items-center justify-center relative select-none group" onMouseUp={handleMouseUp({ type, index })}>
            {slot.item ? (
                <>
                 <div className="w-full h-full flex flex-col items-center justify-center cursor-grab" onMouseDown={handleDragStart(slot.item, { type, index })}>
                    <span className={`text-xs text-center truncate w-full ${slot.item.enchantments && slot.item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(slot.item, language)}</span>
                    <span className="text-lg font-bold">{slot.item.quantity}</span>
                </div>
                 <div className="hidden group-hover:block">
                    <ItemTooltip item={slot.item} language={language} t={t} />
                </div>
                </>
            ) : <span className="text-gray-500 text-xs text-center">{placeholder}</span>}
        </div>
    );
    
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center text-white" onMouseUp={() => setDragged(null)}>
            <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-600 flex gap-8 items-start">
                {/* Left side: Player Inventory */}
                <div className="text-center">
                    <h3 className="text-xl mb-2">{t('inventory')}</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {player.inventory.map((slot, i) => renderSlot(slot, i, 'inventory'))}
                    </div>
                </div>
                
                {/* Right side: Enchanting UI */}
                <div className="flex flex-col items-center gap-4">
                     <h2 className="text-3xl font-bold">{t('enchantingTable')}</h2>
                    <div className="flex items-center gap-4">
                        {renderSlot(itemSlot, 0, 'enchanting', 'Item')}
                        <span className="text-2xl">+</span>
                        {renderSlot(crystalSlot, 1, 'enchanting', 'Crystal')}
                    </div>
                    
                    <div className="w-full h-[2px] bg-gray-600 my-2"></div>

                    <div className="w-full space-y-2">
                        <h3 className="text-xl text-center">{t('enchantments')}</h3>
                        {enchantmentOptions.length > 0 ? enchantmentOptions.map((opt, i) => (
                            <button 
                                key={i} 
                                className="w-full bg-purple-700 hover:bg-purple-800 text-left p-2 rounded"
                                onClick={() => handleEnchant(opt.enchantment)}
                            >
                                {opt.description}
                            </button>
                        )) : (
                            <p className="text-gray-400 text-center">...</p>
                        )}
                    </div>
                </div>
            </div>
             {dragged && (
                <div className="fixed pointer-events-none top-0 left-0" style={{ transform: `translate(${mousePos.x - 32}px, ${mousePos.y - 32}px)` }}>
                    <div className="w-16 h-16 bg-gray-600 border-2 border-yellow-400 rounded flex flex-col items-center justify-center opacity-75">
                         <span className={`text-xs text-center truncate w-full ${dragged.item.enchantments && dragged.item.enchantments.length > 0 ? 'text-purple-400' : ''}`}>{getItemName(dragged.item, language)}</span>
                        <span className="text-lg font-bold">{dragged.item.quantity}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const GameUI: React.FC<GameUIProps> = (props) => {
    const { gameState, setGameState, loadGame, saveExists, startNewGame, language, setLanguage, player, day, isNight, timeInCycle, isBloodMoon, isRaining, creativeMode, showSaveMessage, currentBiome, isNearReturnPortal, activePortal, activeChest, activeFurnace, activeEnchantingTable, activeNPC, dogBeingNamed, showSleepConfirm, skipNight, setShowSleepConfirm, handleNamePet, collectingState } = props;
    
    const t = useCallback((key: string) => {
        return translations[language][key] || key;
    }, [language]);

    if (gameState === GameState.MENU) {
        return (
            <MainMenu
                onPlay={startNewGame}
                onContinue={loadGame}
                saveExists={saveExists}
                t={t}
                language={language}
                setLanguage={setLanguage}
            />
        );
    }
    
    // Fallback for unhandled states, though most are overlays.
    if (gameState === GameState.GAME_OVER) {
         return (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white">
                <h1 className="text-8xl font-bold mb-4 text-red-600">{t('youDied')}</h1>
                <button onClick={startNewGame} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-2xl">
                    {t('restart')}
                </button>
            </div>
        );
    }

    return (
        <div className="text-white pointer-events-none">
            { gameState === GameState.PLAYING && <HUD {...props} t={t} /> }
            { creativeMode && gameState === GameState.PLAYING && <CreativePanel {...props} t={t} /> }
            
            {/* Modal UIs */}
            <div className="pointer-events-auto">
                {gameState === GameState.INVENTORY && <InventoryPanel {...props} t={t} />}
                {gameState === GameState.CREATIVE_INVENTORY && <CreativeInventoryPanel {...props} t={t} />}
                {gameState === GameState.WORKBENCH && <WorkbenchPanel {...props} t={t} />}
                {gameState === GameState.PORTAL_UI && activePortal && <PortalPanel {...props} t={t} />}
                {gameState === GameState.CHEST_UI && activeChest && <ChestPanel {...props} t={t} />}
                {gameState === GameState.FURNACE && activeFurnace && <FurnacePanel {...props} t={t} />}
                {gameState === GameState.VENDOR_SHOP && activeNPC && <VendorShopPanel {...props} t={t} />}
                {gameState === GameState.QUEST_UI && activeNPC && <QuestPanel {...props} t={t} />}
                {gameState === GameState.NAMING_PET && dogBeingNamed && <NamingPetPanel dogId={dogBeingNamed.id} handleNamePet={handleNamePet} t={t} />}
                {gameState === GameState.ENCHANTING && activeEnchantingTable && <EnchantingPanel {...props} t={t} />}
                {showSleepConfirm && <SleepConfirmPanel skipNight={skipNight} setShowSleepConfirm={setShowSleepConfirm} t={t} />}
            </div>

            {collectingState && (
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-64">
                    <div className="w-full bg-gray-700 rounded-full h-5 border-2 border-gray-500">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${collectingState.progress * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameUI;
