class Particle {
    constructor(canvas, x, y, mouseX, mouseY) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.baseX = x;
        this.baseY = y;
        this.density = (Math.random() * 30) + 1;
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        this.speed = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        };
        this.color = `rgba(128, 128, 128, 0.8)`;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;

        // Mouse interaction
        let dx = this.mouseX - this.x;
        let dy = this.mouseY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = 100;
        let force = (maxDistance - distance) / maxDistance;
        
        if (distance < maxDistance) {
            this.x -= forceDirectionX * force * this.density;
            this.y -= forceDirectionY * force * this.density;
        } else {
            if (this.x !== this.baseX) {
                dx = this.baseX - this.x;
                this.x += dx / 20;
            }
            if (this.y !== this.baseY) {
                dy = this.baseY - this.y;
                this.y += dy / 20;
            }
        }

        // Add some autonomous movement
        this.x += Math.sin(this.speed.x) * 0.3;
        this.y += Math.cos(this.speed.y) * 0.3;
    }
}

class ParticleNetwork {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.animate = this.animate.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.init();
    }

    init() {
        const hero = document.querySelector('.hero');
        hero.style.position = 'relative';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        hero.insertBefore(this.canvas, hero.firstChild);

        this.handleResize();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
    }

    handleResize() {
        const hero = document.querySelector('.hero');
        const rect = hero.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const numberOfParticles = (this.canvas.width * this.canvas.height) / 2500;
        
        for (let i = 0; i < numberOfParticles; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.particles.push(new Particle(this.canvas, x, y, this.mouseX, this.mouseY));
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    setupEventListeners() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('resize', this.handleResize);
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 * (1 - distance/100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.update(this.mouseX, this.mouseY);
            particle.draw(this.ctx);
        });
        
        this.drawConnections();
        requestAnimationFrame(this.animate);
    }
}

// Initialize the animation
document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork();
});