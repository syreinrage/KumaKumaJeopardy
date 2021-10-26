
let optionActive = false;
let loaded = false;
let mounted = false;

class Game {
    constructor(){

    }

    init() {
        //Init PIXI application
        this.application = new PIXI.Application({
            width : window.innerWidth,
            height : window.innerHeight,
            devicePixelRatio: 1,
            backgroundColor : 0xF3BBFF,
            view : document.getElementById('game')
        });

        //Add root container to center of screen
        this.root = new PIXI.Container();
        this.overlay = new PIXI.Container();

        this.application.stage.addChild(this.root);
        this.application.stage.addChild(this.overlay);

        this.spinner = new LoadingSpinner();
        this.spinner.draw();
        this.overlay.addChild(this.spinner);

        window.onresize = () => this.resize();
        this.resize();

        this.loader = new PIXI.Loader();
        this.loader.add('gameData', 'js/gameData.json');
        this.loader.add('bg', 'textures/bg.png');
        this.loader.add('pause', 'textures/pause.png');
        this.loader.add('play', 'textures/play.png');

        this.soundLoader = new SoundLoader(() => this.onSoundLoaded());
        this.soundLoader.add('naruto.mp3', 'sound/naruto.mp3');
        this.soundLoader.add('hunterxhunter.mp3', 'sound/hunterxhunter.mp3');
        this.soundLoader.add('demonslayer.mp3', 'sound/demonslayer.mp3');
        this.soundLoader.add('souleater.mp3', 'sound/souleater.mp3');
        this.soundLoader.add('yuyuhakusho.mp3', 'sound/yuyuhakusho.mp3');
        this.soundLoader.load();

        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onSoundLoaded(){
        console.log('Sounds ready');
        this.loader.onComplete.add(() => this.onLoaded());
        this.loader.load();
    }

    onLoaded(){
        loaded = true;

        this.spinner.visible = false;
        this.gameData = this.loader.resources.gameData.data;
        console.log(this.gameData);
        //Add Category
        this.screen = new PIXI.Container();
        this.root.addChild(this.screen);

        this.categories = [];

        let bg = new PIXI.Sprite(this.loader.resources.bg.texture);
        bg.anchor.set(0.5);
        bg.scale.set(1.5);
        this.screen.addChild(bg);
        let categoryContainer = new PIXI.Container();
        let categoryWidth, categoryHeight;

        this.screen.addChild(categoryContainer);
        this.gameData.forEach((element, i) => {
            
            let category = new Category(element.name, element.options, (c,v) => this.onOptionClick(c,v));
            category.draw();

            category.x = (category.boxWidth + 20) * i;
            categoryWidth = category.boxWidth;
            categoryHeight = category.boxHeight;

            this.categories.push(category);


            categoryContainer.addChild(category)
        });
        
        categoryContainer.x = -( (categoryContainer.width) / 2) + categoryWidth / 2;
        categoryContainer.y = -( (categoryContainer.height) / 2) + categoryHeight / 2;

        let optionScreen = new OptionScreen(this.gameData, (c,v,r) => this.onOptionConfirm(c,v,r));
        optionScreen.draw();
        optionScreen.visible= false;
        this.optionScreen = optionScreen;
        this.screen.addChild(optionScreen);

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
                src : e.url
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
    constructor(name, options, clickCallback, fontSize = 32, boxWidth = 230, boxHeight = 70, bgColor = 0xF6E498, lineColor = 0xE8B279, strokeSize = 2){
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
            fontFamily : 'Choko',
            fontSize : fontSize
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
        graphics.drawRect(-this.boxWidth/2, -this.boxHeight/2, this.boxWidth, this.boxHeight);
        graphics.endFill();

        
        this.addChild(graphics);

        let text = new PIXI.Text(this.name, this.textStyle);
        text.anchor.set(0.5);
        this.addChild(text);

        this.options.forEach((o,i) => {
            let option = this.createOption(o);
            option.y += (option.boxHeight + 10) * (i+1);
        });
    }
}

class OptionScreen extends PIXI.Container {
    constructor(gameData, onConfirm, fontSize = 32, boxWidth = 230, boxHeight = 70, bgColor = 0xF6E498, lineColor = 0xE8B279, strokeSize = 2){
        super();
        this.bgColor = bgColor;
        this.lineColor = lineColor;
        this.boxWidth = boxWidth;
        this.boxHeight = boxHeight;
        this.strokeSize = strokeSize;
        this.onConfirm = onConfirm;

        this.contentStroke = 10;
        this.contentLineColor = 0xBEFDF7;
        this.contentBGColor = 0xF9D9FC;
        this.contentWidth = 800;
        this.contentHeight = 500;
        
        this.textStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : 'Choko',
            fontSize : fontSize
        })
        this.gameData = gameData;

        this.contentTextStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : 'Choko',
            fontSize : 50,
            wordWrap : true,
            wordWrapWidth : 670
        });

        this.categoryTextStyle = new PIXI.TextStyle({
            align : 'right',
            fontFamily : 'Arial',
            fontSize : 36,
            fill: 0x595959
        });

        this.valueTextStyle = new PIXI.TextStyle({
            align : 'left',
            fontFamily : 'Arial',
            fontSize : 36,
            fill : 0xFFC319
        });

        this.backTextStyle = new PIXI.TextStyle({
            align : 'center',
            fontFamily : 'Arial',
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
        contentBG.drawRect(-this.contentWidth/2, -this.contentHeight/2, this.contentWidth, this.contentHeight);
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

        let backText = new PIXI.Text("⬅ Back to Panel", this.backTextStyle);
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
    }


    onPlay() {
        console.log('onPlay');

        let resource = game.soundLoader.resources[this.sound];

        if(resource) {
            resource.sound.play();

            this.play.visible = false;
            this.pause.visible = true;
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
    constructor(value, answer, type, category, clickCallback, fontSize = 32, boxWidth = 230, boxHeight = 66.66, bgColor = 0xF6E498, lineColor = 0xE8B279, strokeSize = 2){
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
            fontFamily : 'Arial',
            fontSize : fontSize,
            fill : 0xFFC319,
            dropShadow : true,
            dropShadowColor : 'black',
            dropShadowDistance : 4, 
            dropShadowBlur: 3
        });

        this.state;
    }

    draw() {
        console.log('drawing graphics', this.lineColor, this.strokeSize);
        let front = new PIXI.Container();

        let frontBG = new PIXI.Graphics();

        frontBG.lineStyle({color : this.lineColor, width : this.strokeSize})
        frontBG.beginFill(this.bgColor);
        frontBG.drawRect(-this.boxWidth/2, -this.boxHeight/2, this.boxWidth, this.boxHeight);
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
