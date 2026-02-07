export class MainGame extends Phaser.Scene {
    constructor() { super('MainGame'); }

    create() {
        const v = window.gameApp;
        this.score = 0; this.spd = 500;
        this.cameras.main.setBackgroundColor(v.settings.colors.bg);
        this.gen();

        this.pts = this.add.particles(0, 0, 'bird', {
            speed: 80, scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 }, lifespan: 400, blendMode: 'ADD'
        });

        this.bird = this.physics.add.sprite(200, this.scale.height/2, 'bird').setCollideWorldBounds(true);
        this.bird.body.allowGravity = false;
        this.pts.startFollow(this.bird);

        this.pipes = this.physics.add.group();
        this.enemies = this.physics.add.group();

        for (let i = 0; i < 6; i++) this.addP(800 + i*500);

        this.physics.add.collider(this.bird, this.pipes, () => this.die());
        this.physics.add.overlap(this.bird, this.enemies, () => this.die());

        this.keys = this.input.keyboard.addKeys('A,D');

        this.time.addEvent({ delay: 10000, callback: () => {
            if(v.gameState==='playing') this.spd += v.settings.speedStep;
        }, loop: true });

            this.time.addEvent({ delay: 2000, callback: () => this.addE(), loop: true });
            if (v.gameState !== 'playing') this.scene.pause();
    }

    gen() {
        const c = window.gameApp.settings.colors;
        const h = (s) => parseInt(s.replace('#','0x')) || 0xffffff;
        let g = this.make.graphics({ x:0, y:0, add:false });
        g.fillStyle(h(c.bird)).fillRect(0,0,32,32).generateTexture('bird',32,32);
        g.clear().fillStyle(h(c.pipe)).fillRect(0,0,60,1200).generateTexture('pipe',60,1200);
        g.clear().fillStyle(h(c.enemy)).fillRect(0,0,32,32).generateTexture('enemy',32,32);
    }

    addP(x) {
        const v = window.gameApp;
        const gap = v.settings.gapSize, ext = v.settings.extremity/100;
        const b = (this.scale.height/2)-(gap/2)-50;
        const y = (this.scale.height/2) + Phaser.Math.Between(-b*ext, b*ext);
        let t = this.pipes.create(x, y-gap/2, 'pipe').setOrigin(0.5, 1);
        let bot = this.pipes.create(x, y+gap/2, 'pipe').setOrigin(0.5, 0);
        [t,bot].forEach(p => { p.body.allowGravity=false; p.setVelocityX(-this.spd); });
        t.ok = false;
    }

    addE() {
        const v = window.gameApp;
        if (v.gameState!=='playing' || v.settings.enemyIntensity===0) return;
        let e = this.enemies.create(this.scale.width+100, Phaser.Math.Between(100, this.scale.height-100), 'enemy');
        e.body.allowGravity=false; e.setVelocityX(-(this.spd+200)); e.iq = v.settings.enemyIntensity;
    }

    die() { window.gameApp.gameState = 'gameover'; this.scene.pause(); }

    update(t) {
        const v = window.gameApp;
        if (v.gameState !== 'playing') return;
        const up = this.keys.A.isDown || v.btn.u;
        const down = this.keys.D.isDown || v.btn.d;
        this.bird.setVelocityY(up ? -1000 : (down ? 1000 : 0));

        this.pipes.getChildren().forEach(p => {
            p.setVelocityX(-this.spd);
            if (p.originY===1 && !p.ok && p.x < this.bird.x) { p.ok=true; v.score++; }
            if (p.x < -100) { if(p.originY===1) this.addP(p.x+3000); p.destroy(); }
        });

        this.enemies.getChildren().forEach(e => {
            if (e.iq > 50) e.setVelocityY(Phaser.Math.Clamp(this.bird.y-e.y, -450, 450));
            else e.setVelocityY(Math.sin(t/200)*e.iq*10);
            if (e.x < -200) e.destroy();
        });
    }
}
