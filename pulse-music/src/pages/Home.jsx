import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/home.css';

function Home() {
  const animationStarted = useRef(false);
  const timeRef = useRef(0);
  const globeRef = useRef(null);
  const spritesRef = useRef([]);
  const trailsRef = useRef([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    AOS.init({ duration: 1000, once: true });

    // Setup Three.js Scene
    const heroCanvas = document.getElementById('hero-canvas');
    canvasRef.current = heroCanvas;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, heroCanvas.clientWidth / heroCanvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true });
    renderer.setSize(heroCanvas.clientWidth, heroCanvas.clientHeight);
    camera.position.z = 20;

    // Sphere
    const globeGeometry = new THREE.SphereGeometry(7, 32, 32);
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color(0x1db954) },
        color2: { value: new THREE.Color(0x1a73e8) },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(color1, color2, vUv.y);
          float glow = sin(time * 2.0) * 0.2 + 0.8;
          gl_FragColor = vec4(color * glow, 1.0);
        }
      `,
      wireframe: true,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    globe.scale.setScalar(0.1);
    globeRef.current = globe;
    scene.add(globe);

    // Visualizer Particles
    const visualizerGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = -10 + Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    visualizerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const visualizerMaterial = new THREE.PointsMaterial({
      color: 0x1db954,
      size: 0.2,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const visualizer = new THREE.Points(visualizerGeometry, visualizerMaterial);
    scene.add(visualizer);

    // Musical Symbols
    const symbols = ['𝄞', '♪', '♩', '♫', '♬'];
    const colors = [0x1db954, 0x1a73e8, 0xff0077, 0xffd700, 0xff4500];
    const initialPositions = [];
    const targetPositions = [];
    const orbitRadii = [];
    const orbitSpeeds = [];
    const sprites = [];
    const trails = [];

    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 7;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      initialPositions.push(new THREE.Vector3(x, y, z));

      const targetR = 10 + Math.random() * 5;
      const targetTheta = Math.random() * Math.PI * 2;
      const targetPhi = Math.acos(2 * Math.random() - 1);
      const targetX = targetR * Math.sin(targetPhi) * Math.cos(targetTheta);
      const targetY = targetR * Math.sin(targetPhi) * Math.sin(targetTheta);
      const targetZ = targetR * Math.cos(targetPhi);
      targetPositions.push(new THREE.Vector3(targetX, targetY, targetZ));

      orbitRadii.push(targetR);
      orbitSpeeds.push(0.5 + Math.random() * 0.5);

      const symbol = symbols[i % symbols.length];
      const color = colors[i % colors.length];
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createLabelTexture(symbol, color),
        transparent: true,
        blending: THREE.AdditiveBlending,
      }));
      sprite.scale.set(3, 3, 1);
      const startPos = initialPositions[i].clone().multiplyScalar(0.1);
      sprite.position.copy(startPos);
      scene.add(sprite);
      sprites.push(sprite);

      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(10 * 3);
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      });
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      scene.add(trail);
      trails.push(trail);
    }

    spritesRef.current = sprites;
    trailsRef.current = trails;

    // Animation Logic
    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.016;
      const time = timeRef.current;
      globeMaterial.uniforms.time.value = time;

      globe.rotation.y += 0.005;

      if (time < 1) {
        const scale = 0.1 + (1 - 0.1) * (time / 1);
        globe.scale.setScalar(scale);
        for (let i = 0; i < 50; i++) {
          const pos = initialPositions[i].clone().multiplyScalar(scale);
          sprites[i].position.copy(pos);
          updateTrail(trails[i], pos);
        }
      } else if (time < 3) {
        const t = (time - 1) / 2;
        const easedT = 1 - Math.pow(1 - t, 3);
        for (let i = 0; i < 50; i++) {
          const startPos = initialPositions[i];
          const targetPos = targetPositions[i];
          const pos = startPos.clone().lerp(targetPos, easedT);
          sprites[i].position.copy(pos);
          updateTrail(trails[i], pos);
        }
      } else {
        for (let i = 0; i < 50; i++) {
          const radius = orbitRadii[i];
          const speed = orbitSpeeds[i];
          const angle = (time - 3) * speed;
          const basePos = targetPositions[i].clone().normalize().multiplyScalar(radius);
          const pos = new THREE.Vector3(
            basePos.x * Math.cos(angle) - basePos.z * Math.sin(angle),
            basePos.y,
            basePos.x * Math.sin(angle) + basePos.z * Math.cos(angle)
          );
          sprites[i].position.copy(pos);
          updateTrail(trails[i], pos);

          const opacity = 0.7 + Math.sin(time * 2) * 0.3;
          sprites[i].material.opacity = opacity;
        }
      }

      // Visualizer animation
      const positionsAttr = visualizerGeometry.attributes.position.array;
      for (let i = 0; i < 100; i++) {
        positionsAttr[i * 3 + 1] = -10 + Math.sin(time * 2 + i) * 0.5;
      }
      visualizerGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const width = heroCanvas.clientWidth;
      const height = heroCanvas.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Update trail positions
    function updateTrail(trail, currentPos) {
      const positions = trail.geometry.attributes.position.array;
      for (let j = positions.length - 3; j >= 3; j -= 3) {
        positions[j] = positions[j - 3];
        positions[j + 1] = positions[j - 2];
        positions[j + 2] = positions[j - 1];
      }
      positions[0] = currentPos.x;
      positions[1] = currentPos.y;
      positions[2] = currentPos.z;
      trail.geometry.attributes.position.needsUpdate = true;
    }

    // Reset on page reload
    const handleLoad = () => {
      timeRef.current = 0;
      globeRef.current.scale.setScalar(0.1);
      spritesRef.current.forEach((sprite, i) => {
        const startPos = initialPositions[i].clone().multiplyScalar(0.1);
        sprite.position.copy(startPos);
      });
      trailsRef.current.forEach((trail) => {
        const positions = trail.geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j++) {
          positions[j] = 0;
        }
        trail.geometry.attributes.position.needsUpdate = true;
      });
    };
    window.addEventListener('load', handleLoad);

    // Cleanup
    return () => {
      animationStarted.current = false;
      renderer.dispose();
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function createLabelTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  return (
    <div className="home">
      <section className="hero">
        <canvas id="hero-canvas" className="hero-canvas"></canvas>
        <div className="hero-content" data-aos="fade-up">
          <h1>Welcome to Tune-Genie</h1>
          <p>Discover, stream, and share your favorite music with the world.</p>
          <div className="hero-buttons">
            <Link to="/music" className="btn btn-primary" aria-label="Explore Music">Explore Music</Link>
            <Link to="/about" className="btn btn-secondary" aria-label="Learn More">Learn More</Link>
          </div>
        </div>
      </section>

      {/* <section className="playlists">
        <h2 data-aos="fade-up">Featured Playlists</h2>
        <div className="playlists-grid" data-aos="fade-up" data-aos-delay="100">
          <div className="playlist-card">
            <div className="playlist-img carnatic"></div>
            <h3>Carnatic Classics</h3>
            <p>Timeless kritis by Thyagaraja and more.</p>
          </div>
          <div className="playlist-card">
            <div className="playlist-img global"></div>
            <h3>Global Hits</h3>
            <p>Top tracks from around the world.</p>
          </div>
          <div className="playlist-card">
            <div className="playlist-img indie"></div>
            <h3>Indie Vibes</h3>
            <p>Discover fresh indie artists.</p>
          </div>
        </div>
      </section> */}

      <section className="features">
        <h2 data-aos="fade-up">Why Choose Tune-Genie?</h2>
        <div className="features-grid">
          <div className="feature-card" data-aos="fade-up">
            <div  data-instrument="veena">
              <img className="feature-3d"  src="https://t4.ftcdn.net/jpg/05/04/57/57/360_F_504575716_YGz98cc49kaRjJWpVaoLCKXRH0mGpprq.jpg" alt="" />
            </div>
            <h3>Discover New Music</h3>
            <p>Explore a vast library of songs from emerging and established artists.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div data-instrument="tabla">
              <img className="feature-3d" src="https://thumbs.dreamstime.com/b/tabla-icon-vector-line-logo-mark-symbol-set-collection-outline-style-tabla-icon-black-white-vector-sign-326703950.jpg" alt="" />
            </div>
            <h3>High Quality Audio</h3>
            <p>Experience crystal clear sound with our premium audio streaming.</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div data-instrument="sitar">
              <img className="feature-3d"  src="https://static.vecteezy.com/system/resources/previews/026/219/614/non_2x/community-icon-symbol-design-illustration-vector.jpg" alt="" />
            </div>
            <h3>Join the Community</h3>
            <p>Connect with music lovers and share your favorite tracks.</p>
          </div>
        </div>
      </section>

      <section className="composers">
        <h2 data-aos="fade-up">Legends of Indian Classical Music</h2>
        <div className="composers-grid">
          <div className="composer-card" data-aos="zoom-in">
            <div data-composer="thyagaraja">
              <img className="composer-3d" src="https://carnaticmusicexams.in/wp-content/uploads/2019/01/tyagarajaswamy.jpg" alt="" />
            </div>
            <h3>Thyagaraja (1767–1847)</h3>
            <p>Renowned for his devotional Carnatic kritis in praise of Lord Rama, including the iconic Pancharatna Kritis.</p>
          </div>
          <div className="composer-card" data-aos="zoom-in" data-aos-delay="100">
            <div  data-composer="annamacharya">
              <img className="composer-3d" src="https://i1.sndcdn.com/artworks-000053411217-45xz46-t500x500.jpg" alt="" />
            </div>
            <h3>Annamacharya (1408–1503)</h3>
            <p>Celebrated for his soulful sankirtanas dedicated to Lord Venkateswara, a pioneer of Telugu devotional music.</p>
          </div>
        </div>
      </section>

      {/* <section className="stats">
        <h2 data-aos="fade-up">Why Pulse Music?</h2>
        <div className="stats-grid" data-aos="fade-up" data-aos-delay="100">
          <div className="stat-card">
            <h3>1M+</h3>
            <p>Tracks Available</p>
          </div>
          <div className="stat-card">
            <h3>500K+</h3>
            <p>Active Users</p>
          </div>
          <div className="stat-card">
            <h3>10K+</h3>
            <p>Curated Playlists</p>
          </div>
        </div>
      </section> */}

      {/* <section className="testimonials">
        <h2 data-aos="fade-up">What Our Listeners Say</h2>
        <div className="testimonials-grid" data-aos="fade-up" data-aos-delay="100">
          <div className="testimonial-card">
            <p>"Pulse Music introduced me to Carnatic gems!"</p>
            <h4>Ananya S.</h4>
            <div className="testimonial-img user1"></div>
          </div>
          <div className="testimonial-card">
            <p>"The playlists are always on point!"</p>
            <h4>Rahul K.</h4>
            <div className="testimonial-img user2"></div>
          </div>
          <div className="testimonial-card">
            <p>"Love the classical music selection!"</p>
            <h4>Emma W.</h4>
            <div className="testimonial-img user3"></div>
          </div>
        </div>
      </section> */}

      <section className="cta" data-aos="fade-up">
        <h2>Join the Tune-Genie Community</h2>
        <p>Unlock premium streaming, exclusive playlists, and more with your subscription.</p>
        <Link to="/signup" className="btn btn-primary" aria-label="Join Pulse Music">Join Now</Link>
      </section>
    </div>
  );
}

export default Home;