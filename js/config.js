const CONFIG = {
    AMBIENTE: {
        POEIRA_QTD: 80,
        POEIRA_COR: 'rgba(255, 255, 255, 0.15)',
        POEIRA_VEL_MAX: 0.3,
        NEBULOSA_ATIVO: true,
        NEBULOSA_QTD: 45,
        NEBULOSA_CORES: ['rgba(100, 0, 255, 0.08)', 'rgba(0, 50, 255, 0.08)'],
        PARALLAX_FACTOR: 0.4,
        METEOROS_QTD: 12,
        OBSTACULOS_QTD: 22, 
        ESTRELAS_CADENTES_CHANCE: 0.01,
        METEORO_TYPES: [
            { id: 1, src: 'assets/sprites/meteoros/met_1.png', ratio: 1.0, hitbox: 'circle' },
            { id: 2, src: 'assets/sprites/meteoros/met_2.png', ratio: 0.5, hitbox: 'oval' },
            { id: 3, src: 'assets/sprites/meteoros/met_3.png', ratio: 1.33, hitbox: 'oval' }
        ]
    },
    CAUDA: { 
        COR_INICIO: '#FFFFFF', 
        OP_INICIO: 1.0, 
        COR_MEIO: '#FFCD28',   
        OP_MEIO: 0.8,   
        COR_FIM: '#FF00B2',    
        OP_FIM: 0.0,    
        LARGURA: 19,      
        COMPRIMENTO: 29        
    },
    PARTICULAS: {
        TIRO_COR: '#ffff00',
        TIRO_TAM: 4,          
        RUN_COR: '#FFCD28',
        RUN_TAM: 5,
        EXPLODE_TAM: 5
    },
    GLOW: {
        CAUDA_ON: true,
        CAUDA_INTENSE: 15,
        CAUDA_COR: '#FFCD28',
        TIRO_ON: true,
        TIRO_INTENSE: 10,
        TIRO_COR: '#ffff00'
    },
    GAMEPLAY: {
        VIDA_INICIAL: 100,
        AMMO_INICIAL: 50,
        DANO_TIRO: 15,
        DANO_TOUCH: 20,
        AGGRO_RANGE: 1000,
        RADAR_ZOOM: 0.1,
        CHEST_INTERVAL: 8000,
        CHEST_MAX: 30
    },
    EQUIPAMENTOS: {
        PEM: { RAIO: 450, CARGAS_MAX: 5, COR: '#00ccff', src: 'assets/sprites/itens/pem.png', TAMANHO: 50 },
        BOOST: { RECARGA: 50, CARGAS_MAX: 5, COR: '#ffff00', src: 'assets/sprites/itens/boost.png', TAMANHO: 50 }
    },
    PLAYER: {
        SKINS: [
            'assets/sprites/player/ship.png',
            'assets/sprites/player/skin1.png',
            'assets/sprites/player/skin2.png',
            'assets/sprites/player/skin3.png',
            'assets/sprites/player/skin4.png',
            'assets/sprites/player/skin5.png',
            'assets/sprites/player/skin6.png',
            'assets/sprites/player/skin7.png',
            'assets/sprites/player/skin8.png',
            'assets/sprites/player/skin9.png',
            'assets/sprites/player/skin10.png'
        ],
        TAMANHO_SPRITE: 110,
        SIZE_FISICO: 34,
        ACCEL: 0.4,
        FRICTION: 0.9,
        STAMINA_REGEN: 0.4,
        STAMINA_GENC: 0.8
    },
    ITENS: {
        AMMO: { src: 'assets/sprites/itens/ammo.png', TAMANHO: 70 },
        STAMINA_BAR: { src: 'assets/sprites/itens/stamina_bar.png', TAMANHO: 70 },
        SHIELD: { src: 'assets/sprites/itens/shield.png', TAMANHO: 40 },
        HEALTH: { src: 'assets/sprites/itens/health.png', TAMANHO: 40 },
        MG: { TAMANHO: 40 },
        ORBE: { TAMANHO: 40 },
        BAU_AMMO: { src: 'assets/sprites/itens/bauammo.png' },
        BAU_HEALTH: { src: 'assets/sprites/itens/baubhealth.png' },
        BAU_BLACK: { src: 'assets/sprites/itens/baublack.png' },
        BAU_GOLD: { src: 'assets/sprites/itens/baugold.png' }
    },
    SHIELD_EYE: {
        VIDA: 6,
        VELOCIDADE: 1.2,
        TAMANHO: 40,
        COR: '#8a2be2',
        RAIO_TERRITORIO: 400,
        CHANCE_PEM: 0.60
    },
    INIMIGOS: {
        NORMAL:      { VIDA: 1, VEL: 1.7, TAM: 74, COR: '#FF8800', src: 'assets/sprites/inimigos/normal.png' },
        INTERCEPTOR: { VIDA: 2, VEL: 3.8, TAM: 74, COR: '#A20000', src: 'assets/sprites/inimigos/interceptor.png' }, 
        SCOUT:       { VIDA: 1, VEL: 3.2, TAM: 80, COR: '#A20000', src: 'assets/sprites/inimigos/interceptor2.png', VEL_TIRO: 6 }, 
        SLIME:       { VIDA: 3, VEL: 0.8, TAM: 78, COR: '#43ffb7' },
        ALIEN:       { VIDA: 6, VEL: 1.2, TAM: 60, COR: '#8a2be2' },
        BOSS:        { VIDA: 12, VEL: 0.7, TAM: 74, COR: '#ff00ff' }
    },
    SPAWN_BAU: { CINZA: 0.60, BRONZE: 0.50, AZUL: 0.10, VERMELHO: 0.15, DOURADO: 0.20 },
    LOOT_CINZA: { MUNICAO: 0.50, VIDA: 0.20, ESCUDO: 0.10, STAMINA: 0.20 },
    LOOT_BRONZE: { MUNICAO: 1.00, PEM: 0.00, BOOST: 0.00, VIDA: 0.00 },
    LOOT_OURO: { METRALHADORA: 0.70, STAMINA: 0.10, ESCUDO: 0.10, VIDA: 0.10, PEM: 0.10, BOOST: 0.10 },
    DROP_MONSTER: { COMUM: 0.15, HEAVY: 0.10, ELITE: 1.0, AMMO_W: 0.80, HP_W: 0.20 },
    AUDIO: { PATH: 'assets/bgm.mp3', VOL: 0.3, LOOP: true }
};