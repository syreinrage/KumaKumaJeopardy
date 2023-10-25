let optionActive = false;
let loaded = false;
let mounted = false;



const Settings = {
    OPTION_MARGIN_X : 35,
    OPTION_MARGIN_Y : 35,

    Backdrop : {
        FILL : 0xFFE9F4,
        STROKE : 0xFF7286,
        WIDTH : window.innerWidth - 500,
        HEIGHT : window.innerHeight - 200,
        STROKE_SIZE : 10,
        BOX_ROUNDING : 20,
    },

    Category : {
        FILL : 0xFFFFFF,
        STROKE : 0xFF7286,
        WIDTH : 230,
        HEIGHT : 70,
        STROKE_SIZE : 5,
        FONT_SIZE : 36,
        BOX_WIDTH : 250,
        BOX_HEIGHT : 75,
        BOX_ROUNDING : 10,
        FONT : 'Choko'
    },

    Option : {
        FILL : 0xFFE9F4,
        STROKE : 0xFF7286,
        WIDTH : 230,
        HEIGHT : 70,
        STROKE_SIZE : 5,
        FONT_SIZE : 40,
        BOX_WIDTH : 250,
        BOX_HEIGHT : 75,
        BOX_ROUNDING : 10,
        FONT : 'Choko'
    },

    Modal : {
        FILL : 0xFFE9F4,
        STROKE : 0xFF7286,
        WIDTH : 800,
        HEIGHT : 500,
        STROKE_SIZE : 10,
        BOX_ROUNDING : 20,
        FONT : 'Verdana',
        TITLE_FONT_SIZE : 40,
        TITLE_COLOR : 0x000000,
        CONTENT_FONT_SIZE : 36,
        CONTENT_COLOR : 0x000000,
        VALUE_FONT_SIZE : 50,
        VALUE_COLOR : 0xFF7286,
    }
}

class Game {
    constructor(){

    }

    /**
     * Initializes the game.
     */
    init() {
        // Initialize PIXI application
        this.application = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: 1,
            backgroundColor: 0xffe9f4,
            view: document.getElementById('game'),
            antialias: true,
        });

        // Add root container to center of screen
        this.root = new PIXI.Container();
        this.overlay = new PIXI.Container();

        this.application.stage.addChild(this.root);
        this.application.stage.addChild(this.overlay);

        // Add loading spinner to overlay
        this.spinner = new LoadingSpinner();
        this.spinner.draw();
        this.overlay.addChild(this.spinner);

        // Resize application on window resize
        window.onresize = () => this.resize();
        this.resize();

        // Load game assets
        this.loader = new PIXI.Loader();
        this.loader.add('gameData', 'js/gameData.json');
        this.loader.add('starEmitter', 'js/starEmitter.json');
        this.loader.add('bg', 'textures/gradient.jpg');
        this.loader.add('star', 'textures/star.png');
        this.loader.add('pause', 'textures/pause.png');
        this.loader.add('play', 'textures/play.png');

        // Load game sounds
        this.soundLoader = new SoundLoader(() => this.onSoundLoaded());
        this.soundLoader.add('Digimon.mp3', 'sound/Digimon.mp3');
        this.soundLoader.add('Attack on Titan Final Season Opening 2  The Rumbling.mp3', 'sound/Attack on Titan Final Season Opening 2  The Rumbling.mp3');
        this.soundLoader.add('Oshi no Ko Opening - IDOL.mp3', 'sound/Oshi no Ko Opening - IDOL.mp3');
        this.soundLoader.add('Jujutsu Kaisen Opening 4 - SPECIALZ.mp3', 'sound/Jujutsu Kaisen Opening 4 - SPECIALZ.mp3');
        this.soundLoader.add('CHAINSAW MAN Opening - KICK BACK.mp3', 'sound/CHAINSAW MAN Opening - KICK BACK.mp3');
        this.soundLoader.load();

        //Add update function to pixi ticker
        this.application.ticker.add((e) => this.update(e));


        // Listen for key events
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    update(e) {
    }

    onSoundLoaded(){
        console.log('Sounds ready');
        this.loader.onComplete.add(() => this.onLoaded());
        this.loader.load();
    }

    /**
     * Callback function for when game assets are loaded.
     * @private
     */
    onLoaded() {
        // Set loaded flag to true
        loaded = true;

        // Hide loading spinner
        this.spinner.visible = false;

        // Load game data
        this.gameData = this.loader.resources.gameData.data;
        console.log(this.gameData);

        // Add category container to screen
        this.screen = new PIXI.Container();
        this.root.addChild(this.screen);

        // Initialize categories
        this.categories = [];
        let bg = new PIXI.Sprite(this.loader.resources.bg.texture);
        bg.anchor.set(0.5);
        //bg.scale.set(1.5);
        this.screen.addChild(bg);

        //Intialize background star emitter
        let starContainer = new PIXI.Container();
        starContainer.emitter = new PIXI.particles.Emitter(starContainer, PIXI.particles.upgradeConfig(this.loader.resources.starEmitter.data, [this.loader.resources.star.texture]));
        starContainer.emitter.autoUpdate = true;

        starContainer.y -= 1000;
        this.screen.addChild(starContainer);

        this.starContainer = starContainer;


        //Initialize the BG Modal
        let bgModal = new PIXI.Graphics();
        
        let w = Settings.Backdrop.WIDTH;
        let h = Settings.Backdrop.HEIGHT;
        let r = 20;
        
        bgModal.lineStyle(Settings.Backdrop.STROKE_SIZE, Settings.Backdrop.STROKE);
        bgModal.beginFill(Settings.Backdrop.FILL);
        bgModal.drawRoundedRect(-w/2, -h/2, w, h, r);
        bgModal.endFill();
        this.screen.addChild(bgModal);

        let categoryContainer = new PIXI.Container();
        let categoryWidth, categoryHeight;
        this.screen.addChild(categoryContainer);
        this.gameData.forEach((element, i) => {
            let category = new Category(element.name, element.options, (c,v) => this.onOptionClick(c,v));
            category.draw();
            category.x = (category.boxWidth + Settings.OPTION_MARGIN_X) * i;
            categoryWidth = category.boxWidth;
            categoryHeight = category.boxHeight;
            this.categories.push(category);
            categoryContainer.addChild(category)
        });

        // Position category container
        categoryContainer.x = -( (categoryContainer.width) / 2) + categoryWidth / 2;
        categoryContainer.y = -( (categoryContainer.height) / 2) + categoryHeight / 2;

        // Initialize option screen
        let optionScreen = new OptionScreen(this.gameData, (c,v,r) => this.onOptionConfirm(c,v,r));
        optionScreen.draw();
        optionScreen.visible= false;
        this.optionScreen = optionScreen;
        this.screen.addChild(optionScreen);

        // Set mounted flag to true
        mounted = true;
    }
    onKeyUp(e) {
        if(!loaded || !mounted) return;
        
        if(!optionActive) {
            if(e.code == 'KeyR'){
                this.reset();
            }
        } else {
            this.optionScreen.onKeyUp(e);
        }
    }

    onOptionClick(category, value) {
        this.optionScreen.showOption(category, value);
    }

    onOptionConfirm(category, value, reset) {
        let group = this.categories.find(c => c.name == category);
        let option = group.children.find(c => {
            return c instanceof GameOption && c.value == value;
        });

        if(option){
            option.setState(reset ? OptionStates.UNANSWERED : OptionStates.ANSWERED);
        }
    }

    reset() {
        this.categories.forEach(c => {
            c.children.forEach(child => {
                if(child instanceof GameOption) {
                    child.setState(OptionStates.UNANSWERED);
                }
            });
        });
        
    }
 
    resize() {
        this.root.position.set(window.innerWidth/2, window.innerHeight/2);
        this.overlay.position.set(window.innerWidth/2, window.innerHeight/2);
    }

}

class LoadingSpinner extends PIXI.Container {
    constructor() {
        super();
    }

    draw() {
        this.sprite = new PIXI.Sprite.from('textures/kumalogo.png');
        this.sprite.anchor.set(0.5,0.75);

        this.addChild(this.sprite);

        this.sprite.rotation = -Math.PI*0.125;
        let tween = gsap.to(this.sprite, {rotation : Math.PI*0.125, yoyo : true, duration : 1, ease:"Back.easeInOut", repeat : -1});
        tween.play();
    }
}

class SoundLoader {
    constructor(loadComplete) {
        this.resources = {};
        this.loadComplete = loadComplete;
    }

    add(key, url) {
        this.resources[key] = {key, url, loaded : false};
    }

    load(){
        Object.entries(this.resources).forEach(([k,e]) => {
            console.log(`Loading sound ${k} from ${e.url}`);
            let sound = new Howl({
                src : e.url,
                sprite: {
                    four: [0, 3000],
                    six: [0, 5000],
                    seven: [0, 7000],
                    full: [0, 30000]
                  }
            });

            e.sound = sound;
            sound.once('load', () => this.onFileLoad(k));
        });
    }

    onFileLoad(key){
        console.log('Sound loaded:', key);
        if(this.resources[key]) this.resources[key].loaded = true;

        if(Object.entries(this.resources).find(([k,e])=> !e.loaded) == null){
            console.log('All sounds loaded!');
            this.onLoadComplete();
        }
    }

    onLoadComplete(){
        if(this.loadComplete) this.loadComplete(this, this.resources);
    }
}

class Category extends PIXI.Container {
    constructor(name, options, clickCallback, fontSize = Settings.Category.FONT_SIZE, boxWidth = Settings.Category.BOX_WIDTH, boxHeight = Settings.Category.BOX_HEIGHT, bgColor = Settings.Category.FILL, lineColor = Settings.Category.STROKE, strokeSize = Settings.Category.STROKE_SIZE){
        super();
        this.bgColor = bgColor;
        this.lineColor = lineColor;
        this.boxWidth = boxWidth;
        this.boxHeight = boxHeight;
        this.strokeSize = strokeSize;
        this.clickCallback = clickCallback;
        this.name = name;
        this.textStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : Settings.Category.FONT,
            fontSize : fontSize,
            fontWeight : 'bold',
        })
        this.options = options;

        this.showOption;
        this.onBack;
    }

    createOption(data) {
        let option = new GameOption(data.value, data.answer, data.type, this.name, this.clickCallback);
        this.addChild(option);
        option.draw();
       
        return option;
    }

    draw() {
        let graphics = new PIXI.Graphics();

        graphics.lineStyle({color : this.lineColor, width : this.strokeSize})
        graphics.beginFill(this.bgColor);
        graphics.drawRoundedRect(-this.boxWidth/2, -this.boxHeight/2, this.boxWidth, this.boxHeight, 10);
        graphics.endFill();

        
        this.addChild(graphics);

        let text = new PIXI.Text(this.name, this.textStyle);
        text.anchor.set(0.5);
        this.addChild(text);

        this.options.forEach((o,i) => {
            let option = this.createOption(o);
            option.y += (option.boxHeight + Settings.OPTION_MARGIN_Y) * (i+1);
        });
    }
}

class OptionScreen extends PIXI.Container {
    constructor(gameData, onConfirm, 
        fontSize = Settings.Modal.FONT_SIZE, 
        boxWidth = Settings.Modal.BOX_WIDTH,
        boxHeight = Settings.Modal.BOX_HEIGHT,
        bgColor = Settings.Modal.FILL,
        lineColor = Settings.Modal.STROKE,
        strokeSize = Settings.Modal.STROKE_SIZE
    ){
        super();
        this.bgColor = bgColor;
        this.lineColor = lineColor;
        this.boxWidth = boxWidth;
        this.boxHeight = boxHeight;
        this.strokeSize = strokeSize;
        this.onConfirm = onConfirm;

        this.contentStroke = strokeSize;
        this.contentLineColor = lineColor;
        this.contentBGColor = bgColor;
        this.contentWidth = 800;
        this.contentHeight = 500;
        
        this.textStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : 'Verdana',
            fontSize : fontSize
        })
        this.gameData = gameData;

        this.contentTextStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : Settings.Modal.FONT,
            fontSize : Settings.Modal.CONTENT_FONT_SIZE,
            fill : Settings.Modal.CONTENT_COLOR,
            wordWrap : true,
            wordWrapWidth : 670
        });

        this.categoryTextStyle = new PIXI.TextStyle({
            align : 'right',
            fontFamily : Settings.Category.FONT,
            fontWeight : 'bold',
            fontSize : Settings.Modal.TITLE_FONT_SIZE,
            fill: Settings.Modal.TITLE_COLOR
        });

        this.valueTextStyle = new PIXI.TextStyle({
            align : 'left',
            fontFamily : Settings.Option.FONT,
            fontSize : Settings.Modal.VALUE_FONT_SIZE,
            fill : Settings.Modal.VALUE_COLOR,
            strokeThickness : 10,
            stroke : "#FFFFFF",
            lineJoin : "round",
            fontWeight : "bold"
        });

        this.backTextStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : 'Verdana',
            fontSize : 36,
            fill : 0x6D9EEB
        });
    }

    showOption(categoryName, value) {
        optionActive = true;

        this.visible = true;

        let category = this.gameData.find(c => c.name == categoryName);
        let option = category.options.find(o => o.value == value);

        this.categoryText.text = category.name + " · ";
        this.valueText.text = "$" + option.value;

        if(option.type == 'sound') {
            this.contentText.visible = false;
            this.soundControl.visible = true;

            this.sound = option.answer;
        }

        if(option.type == 'text') {
            this.contentText.visible = true;
            this.soundControl.visible = false;

            this.contentText.text = option.answer;
        }

        this.currentOption = option;
        this.currentCategory = categoryName;
    }

    draw() {
        let content = new PIXI.Container();
        let contentBG = new PIXI.Graphics();

        contentBG.lineStyle({color : this.contentLineColor, width : this.contentStroke})
        contentBG.beginFill(this.contentBGColor);
        contentBG.drawRoundedRect(-this.contentWidth/2, -this.contentHeight/2, this.contentWidth, this.contentHeight, Settings.Modal.BOX_ROUNDING);
        contentBG.endFill();

        content.addChild(contentBG);
        
        let contentText = new PIXI.Text(this.answer, this.contentTextStyle);
        contentText.anchor.set(0.5);
        content.addChild(contentText);
        this.contentText = contentText;

        let categoryText = new PIXI.Text(this.category + " · ", this.categoryTextStyle);
        categoryText.anchor.set(1,0.5);
        categoryText.position.set(42, -209);
        content.addChild(categoryText);
        this.categoryText = categoryText;

        let valueText = new PIXI.Text("$" + this.value, this.valueTextStyle);
        valueText.anchor.set(0, 0.5);
        valueText.position.set(42, -209);
        content.addChild(valueText);
        this.valueText = valueText;

        let backText = new PIXI.Text("⬅", this.backTextStyle);
        backText.anchor.set(0.5);
        backText.position.set(0, 300);
        backText.interactive = true;
        backText.name = 'backText';
        backText.on('pointerdown', (event) => this.onBack(event));
        content.addChild(backText);

        let soundControl = new PIXI.Container();
        content.addChild(soundControl);
        this.soundControl = soundControl;

        let play = new PIXI.Sprite(game.loader.resources.play.texture);
        play.anchor.set(0.5);
        play.interactive = true;
        play.on('pointerup', () => this.onPlay());
        this.play = play;
        soundControl.addChild(play);

        let pause = new PIXI.Sprite(game.loader.resources.pause.texture);
        pause.anchor.set(0.5);
        pause.interactive = true;
        pause.visible = false;
        pause.on('pointerup', () => this.onPause());
        this.pause = pause;
        soundControl.addChild(pause);

        this.content = content;

        this.addChild(content);
    }

    onKeyUp(e){
        if(!optionActive || !this.currentOption) return;
        console.log('Pressed', e.name, e.code);
        if(e.code == 'Space') {
            if(this.onConfirm) this.onConfirm(this.currentCategory  , this.currentOption.value);
            this.onBack();
        }

        if(e.code == 'KeyR') {
            if(this.onConfirm) this.onConfirm(this.currentCategory  , this.currentOption.value, true);
            this.onBack();
        }
        if(e.code == 'KeyP') {
            this.onPlay('four');
        }
        if(e.code == 'KeyO') {
            this.onPlay('six');
        }
        if(e.code == 'KeyI') {
            this.onPlay('seven');
        }
        if(e.code == 'KeyF') {
            this.onPlay();
        }
    }


    onPlay(e) {
        let resource = game.soundLoader.resources[this.sound];
        this.play.visible = false;
        this.pause.visible = true;
        if(resource) {
            if (e === undefined || e == null || e == "undefined") {
                resource.sound.play('full');
            }                
            else {
                resource.sound.play(e);
            }
        }
    }

    onPause() {
        console.log('onPause')

        let resource = game.soundLoader.resources[this.sound];

        if(resource) {
            resource.sound.stop();

            this.play.visible = true;
            this.pause.visible = false;
        }
    }

    onBack() {
        optionActive = false;

        if(this.sound) {
            this.onPause();
        }

        this.visible = false;
    }
}

const OptionStates = {
    UNSELECTED: 0,
    UNANSWERED: 1,
    ANSWERED: 2
}

const OptionTypes = {
    TEXT: 0,
    SOUND: 1,
    IMAGE: 2
}
class GameOption extends PIXI.Container {
    constructor(value, answer, type, category, clickCallback, 
        fontSize = Settings.Option.FONT_SIZE, 
        boxWidth = Settings.Option.BOX_WIDTH, 
        boxHeight = Settings.Option.BOX_HEIGHT, 
        bgColor = Settings.Option.FILL, 
        lineColor = Settings.Option.STROKE, 
        strokeSize = Settings.Option.STROKE_SIZE
    ){
        super();
        this.bgColor = bgColor;
        this.lineColor = lineColor;
        this.boxWidth = boxWidth;
        this.boxHeight = boxHeight;
        this.strokeSize = strokeSize;
        this.clickCallback = clickCallback;

        this.value = value;
        this.answer = answer;
        this.category = category;
        this.type = type;

        this.frontTextStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : Settings.Option.FONT,
            fontSize : fontSize,
            fill : Settings.Backdrop.STROKE,
            fontWeight : "bold",
            strokeThickness : 10,
            stroke : "#FFFFFF",
            lineJoin : "round",
        });

        this.state;
    }

    draw() {
        console.log('drawing graphics', this.lineColor, this.strokeSize);
        let front = new PIXI.Container();

        let frontBG = new PIXI.Graphics();

        frontBG.lineStyle({color : this.lineColor, width : this.strokeSize})
        frontBG.beginFill(this.bgColor);
        frontBG.drawRoundedRect(-this.boxWidth/2, -this.boxHeight/2, this.boxWidth, this.boxHeight, Settings.Option.BOX_ROUNDING);
        frontBG.endFill();

        front.addChild(frontBG);

        let text = new PIXI.Text("$" + this.value, this.frontTextStyle);
        text.anchor.set(0.5);
        front.addChild(text);
        this.text = text;

        this.front = front;

        this.interactive = true;
        this.interactiveChildren = true;
        this.on('pointerdown', (event) => this.handleTouch(event));


        this.addChild(front);

        this.setState(OptionStates.UNSELECTED);
    }

    setState(state) {
        if(this.state != state) {
            let prevState = this.state;
            this.state = state;

            switch(this.state) {
                case OptionStates.UNSELECTED:
                    
                    break;
                case OptionStates.UNANSWERED:
                    this.text.visible = true;
                    break;
                case OptionStates.ANSWERED:
                    this.text.visible = false;
                    break;
            }
        }
    }   

    handleTouch(event) {
        console.log('click option', this.value, this.category, event.currentTarget);
        //if(this.onClick) this.onClick(this);
        if(optionActive) return;
        if(this.clickCallback) this.clickCallback(this.category, this.value);
        
    }
}



window.onload = () => {
    window.game = new Game()

    window.game.init();
}
