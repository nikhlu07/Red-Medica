
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

const Index = () => {
  const heroCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const header = document.getElementById('header');
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header?.classList.add('bg-white/80', 'backdrop-blur-sm', 'border-b', 'border-gray-200', 'shadow-sm');
      } else {
        header?.classList.remove('bg-white/80', 'backdrop-blur-sm', 'border-b', 'border-gray-200', 'shadow-sm');
      }
    };
    window.addEventListener('scroll', handleScroll);

    const animateOnScroll = (elem: any, vars: any) => {
      gsap.from(elem, {
        scrollTrigger: {
          trigger: elem,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
        ...vars
      });
    };

    gsap.utils.toArray('#problem .card').forEach((card: any, i) => {
      animateOnScroll(card, { delay: i * 0.1 });
    });
    animateOnScroll('#problem .bg-white', {});

    gsap.utils.toArray('#solution .grid').forEach((el) => {
      animateOnScroll(el, {});
    });

    animateOnScroll('#howitworks .max-w-5xl', {});
    gsap.utils.toArray('#features .feature-card').forEach((card: any, i) => {
      animateOnScroll(card, { delay: i * 0.05 });
    });
    animateOnScroll('#features .text-center:last-child', {});
    animateOnScroll('#contact .cta-gradient', {});

    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      const titleText = heroTitle.textContent?.trim() ?? '';
      heroTitle.innerHTML = '';
      titleText.split('').forEach(char => {
        const span = document.createElement('span');
        span.className = 'hero-title-char';
        span.style.whiteSpace = char === ' ' ? 'pre' : 'normal';
        span.textContent = char;
        heroTitle.appendChild(span);
      });

      gsap.from(".hero-title-char", {
        opacity: 0, y: 50, rotateX: -90, stagger: 0.03, duration: 1, ease: "power3.out", delay: 0.5
      });
    }
    gsap.from(".hero-subtitle", { opacity: 0, y: 20, duration: 1, ease: "power3.out", delay: 1.2 });
    gsap.from(".hero-buttons", { opacity: 0, y: 20, duration: 1, ease: "power3.out", delay: 1.5 });

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('#tab-content > div');
    const tabImages = document.querySelectorAll('#tab-image-container > img');

    const handleTabClick = (button: Element) => {
      const tab = (button as HTMLElement).dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tab) {
          content.classList.add('active');
        }
      });

      tabImages.forEach(image => {
        image.classList.remove('active');
        if ((image as HTMLElement).dataset.tabImg === tab) {
          image.classList.add('active');
        }
      });
    };

    tabButtons.forEach(button => {
      button.addEventListener('click', () => handleTabClick(button));
    });

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, particles: THREE.Points, lines: THREE.LineSegments, group: THREE.Group;
    const container = heroCanvasRef.current;
    if (!container) return;

    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    function init() {
      scene = new THREE.Scene();
      group = new THREE.Group();
      scene.add(group);

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      const particleCount = 200;
      const positions = new Float32Array(particleCount * 3);
      const particleVelocities: THREE.Vector3[] = [];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        particleVelocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1));
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const particleMaterial = new THREE.PointsMaterial({ color: 0x2563EB, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, sizeAttenuation: true });

      particles = new THREE.Points(particleGeometry, particleMaterial);
      (particles as any).velocities = particleVelocities;
      group.add(particles);

      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x93C5FD, linewidth: 1, transparent: true, opacity: 0.15 });
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particleCount * particleCount * 6), 3));
      lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      group.add(lines);

      window.addEventListener('resize', onWindowResize, false);
      container.addEventListener('mousemove', onMouseMove, false);
      container.addEventListener('mousedown', onMouseDown, false);
      container.addEventListener('mouseup', onMouseUp, false);
      container.addEventListener('mouseleave', onMouseUp, false);
    }

    function onWindowResize() {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseDown(event: MouseEvent) {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    function onMouseUp() {
      isDragging = false;
    }

    function onMouseMove(event: MouseEvent) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        group.rotation.y += deltaMove.x * 0.005;
        group.rotation.x += deltaMove.y * 0.005;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }

    function animate() {
      if (!particles || !lines) return;
      requestAnimationFrame(animate);

      const positions = particles.geometry.attributes.position.array as Float32Array;
      const linePositions = lines.geometry.attributes.position.array as Float32Array;
      const velocities = (particles as any).velocities as THREE.Vector3[];

      for (let i = 0; i < particles.geometry.attributes.position.count; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;
        if (positions[i * 3 + 1] < -50 || positions[i * 3 + 1] > 50) velocities[i].y = -velocities[i].y;
        if (positions[i * 3] < -50 || positions[i * 3] > 50) velocities[i].x = -velocities[i].x;
        if (positions[i * 3 + 2] < -50 || positions[i * 3 + 2] > 50) velocities[i].z = -velocities[i].z;
      }

      const connectDistance = 10;
      let lineCount = 0;
      for (let i = 0; i < particles.geometry.attributes.position.count; i++) {
        for (let j = i + 1; j < particles.geometry.attributes.position.count; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < connectDistance) {
            linePositions[lineCount++] = positions[i * 3];
            linePositions[lineCount++] = positions[i * 3 + 1];
            linePositions[lineCount++] = positions[i * 3 + 2];
            linePositions[lineCount++] = positions[j * 3];
            linePositions[lineCount++] = positions[j * 3 + 1];
            linePositions[lineCount++] = positions[j * 3 + 2];
          }
        }
      }
      for (let i = lineCount; i < linePositions.length; i++) linePositions[i] = 0;

      lines.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.position.needsUpdate = true;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      group.updateMatrixWorld();
      const worldMatrix = group.matrixWorld;

      const target = new THREE.Vector3();
      raycaster.ray.at(100, target);

      for (let i = 0; i < particles.geometry.attributes.position.count; i++) {
        const particlePos = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        particlePos.applyMatrix4(worldMatrix);

        const distanceToMouse = target.distanceTo(particlePos);

        if (distanceToMouse < 20) {
          const direction = new THREE.Vector3().subVectors(particlePos, target).normalize();
          const localDirection = direction.transformDirection(new THREE.Matrix4().copy(worldMatrix).invert());
          velocities[i].add(localDirection.multiplyScalar(0.1));
        }
        velocities[i].multiplyScalar(0.98);
      }

      if (!isDragging) {
        group.rotation.y += 0.0002;
      }

      camera.position.x += (mouse.x * 5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 5 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    init();
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', onWindowResize);
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mouseleave', onMouseUp);
      }
      tabButtons.forEach(button => {
        button.removeEventListener('click', () => handleTabClick(button));
      });
    }

  }, []);

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(white, white);
            color: #1A202C;
            overflow-x: hidden;
        }
        #hero-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        .hero-content {
            position: relative;
            z-index: 2;
        }
        .card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
        }
        .card:hover {
            border-color: #3B82F6;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(90deg, #3B82F6, #2563EB);
        }
        .glow {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }
        ::selection {
            background-color: #3B82F6;
            color: white;
        }
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #EDF2F7;
        }
        ::-webkit-scrollbar-thumb {
            background: #A0AEC0;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #718096;
        }
        .hero-title-char {
            display: inline-block;
        }
        .tab-button {
            transition: all 0.3s ease;
            border-bottom: 2px solid transparent;
        }
        .tab-button.active {
            color: #2563EB;
            border-color: #2563EB;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .feature-card {
            background: #F0F5FF;
            border: 1px solid #D1E0FF;
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            background: white;
            border-color: #3B82F6;
            transform: translateY(-5px);
        }
      `}</style>
      <div className="antialiased">
        <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300" id="header">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <img src="logo.svg" alt="Red Médica Logo" className="h-8 w-auto" />
                <span className="ml-3 text-2xl font-bold tracking-tighter text-gray-800">Red Médica</span>
              </div>
              <nav className="hidden md:flex items-center space-x-10 text-sm font-medium">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 px-3 py-2">Dashboard</Link>
                <Link to="/verify" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 px-3 py-2">Verify</Link>
                <Link to="/analytics" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 px-3 py-2">Analytics</Link>
                <Link to="/help" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 px-3 py-2">Help</Link>
              </nav>
              <div>
                <Link to="/connect" className="hidden sm:inline-block cta-gradient text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all duration-300">Get Started</Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
            <div id="hero-canvas" ref={heroCanvasRef}></div>
            <div className="hero-content container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 mb-6 hero-title">
                Trust in Every Dose.
              </h1>
              <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 mb-10 hero-subtitle">
                Red Médica leverages blockchain to create an immutable, transparent, and secure medical supply chain. We're eliminating counterfeit drugs and ensuring patient safety, from manufacturer to patient.
              </p>
              <div className="flex justify-center items-center gap-4 hero-buttons">
                <Link to="/connect" className="cta-gradient text-white font-semibold px-8 py-3.5 rounded-lg text-base hover:opacity-90 transition-all duration-300 glow">Get Started</Link>
                <Link to="/verify" className="group flex items-center gap-2 rounded-lg border-2 border-blue-600/80 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm backdrop-blur-sm transition-all hover:border-blue-600 hover:bg-blue-500/20 hover:shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verify Product</span>
                </Link>
              </div>
            </div>
          </section>

          <section id="problem" className="py-20 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">A Global Health Crisis in Plain Sight.</h2>
                <p className="text-lg text-gray-600 mb-12">The counterfeit drug market isn't a distant threat—it's a clear and present danger impacting millions of lives. The trust in our medical supply chain is broken, and the consequences are devastating.</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="card p-6 rounded-xl text-center">
                    <div className="text-5xl font-extrabold text-blue-600 mb-2">1M+</div>
                    <h3 className="text-lg font-bold text-gray-900">Deaths Annually</h3>
                  </div>
                  <div className="card p-6 rounded-xl text-center">
                    <div className="text-5xl font-extrabold text-blue-600 mb-2">$200B</div>
                    <h3 className="text-lg font-bold text-gray-900">Annual Economic Loss</h3>
                  </div>
                  <div className="card p-6 rounded-xl text-center">
                    <div className="text-5xl font-extrabold text-blue-600 mb-2">1 in 10</div>
                    <h3 className="text-lg font-bold text-gray-900">Drugs are Counterfeit</h3>
                  </div>
                  <div className="card p-6 rounded-xl text-center">
                    <div className="text-5xl font-extrabold text-blue-600 mb-2">95%</div>
                    <h3 className="text-lg font-bold text-gray-900">Pharmacies Face Stockouts</h3>
                  </div>
                </div>
                <div className="bg-white border border-blue-200 p-8 rounded-xl shadow-sm">
                  <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="font-medium text-xl text-blue-900 italic">
                    "My daughter died because we couldn't verify if her medication was real. The bottle looked authentic, but it was just colored water."
                  </p>
                  <p className="text-right mt-4 text-blue-700 font-semibold">— Mother from Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </section>

          <section id="solution" className="py-20 lg:py-32 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">An Immutable Chain of Trust.</h2>
                <p className="text-lg text-gray-600">Red Médica provides a digital passport for every medical product, creating an unforgeable record of its journey from the factory to your hands. We turn opacity into transparency.</p>
              </div>
              <div className="space-y-16">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-600 font-semibold px-4 py-1 rounded-full mb-4">Step 1</span>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Register on the Blockchain</h3>
                    <p className="text-gray-600 mb-6">Manufacturers register each batch, creating a unique, tamper-proof digital identity. Secure QR codes are generated for every single item, linking the physical to the digital.</p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Tamper-proof digital identity</li>
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Secure QR code generation</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-8 border">
                    <img src="/Batch Registration UI.png" alt="Product Registration UI" className="rounded-lg shadow-lg border border-gray-200 w-full" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div className="bg-gray-50 rounded-xl p-8 border md:order-last">
                    <img src="/Live Tracking Dashboard.png" alt="Supply Chain Tracking" className="rounded-lg shadow-lg border border-gray-200 w-full" />
                  </div>
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-600 font-semibold px-4 py-1 rounded-full mb-4">Step 2</span>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Track in Real-Time</h3>
                    <p className="text-gray-600 mb-6">Every handover is recorded as a secure transaction. Our live dashboard tracks location, temperature (via IoT), and custody, providing unparalleled visibility.</p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Complete chain of custody</li>
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Real-time condition monitoring</li>
                    </ul>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-600 font-semibold px-4 py-1 rounded-full mb-4">Step 3</span>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Verify with a Scan</h3>
                    <p className="text-gray-600 mb-6">With a simple smartphone scan, anyone—from pharmacists to patients—can instantly view the entire history of their medication, ensuring it's genuine and safe before use.</p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Empowering patients and providers</li>
                      <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Instant peace of mind</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-8 border">
                    <img src="/QR Scan Result.png" alt="QR Verification" className="rounded-lg shadow-lg border border-gray-200 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="howitworks" className="py-20 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">A Unified Platform for Every Role.</h2>
                <p className="text-lg text-gray-600">Our role-specific workflows ensure seamless adoption and maximum security at every stage of the supply chain.</p>
              </div>

              <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-blue-200 shadow-sm">
                <div className="flex flex-wrap justify-center mb-6 gap-x-4 gap-y-2">
                  <button className="tab-button active font-semibold py-3 px-8" data-tab="manufacturers">Manufacturers</button>
                  <button className="tab-button font-semibold py-3 px-8" data-tab="distributors">Distributors</button>
                  <button className="tab-button font-semibold py-3 px-8" data-tab="providers">Providers</button>
                  <button className="tab-button font-semibold py-3 px-8" data-tab="patients">Patients</button>
                </div>

                <div id="tab-content" className="grid md:grid-cols-2 gap-10 items-center p-4">
                  <div id="manufacturers" className="tab-content active">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Protect Your Brand Integrity</h3>
                    <p className="text-gray-600 mb-4">Easily create secure digital identities for your products, monitor your supply chain in real-time against diversion and theft, and provide your customers with verifiable proof of authenticity.</p>
                  </div>
                  <div id="distributors" className="tab-content">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Optimize Your Logistics</h3>
                    <p className="text-gray-600 mb-4">Streamline custody transfers with secure, verifiable transactions. Monitor shipment conditions like temperature and reduce losses from theft or damage with an immutable audit trail.</p>
                  </div>
                  <div id="providers" className="tab-content">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Ensure Patient Safety</h3>
                    <p className="text-gray-600 mb-4">Verify every product before administration, from a single vial to a full pallet. Access a complete, unforgeable audit trail instantly, ensuring patient safety and simplifying regulatory compliance.</p>
                  </div>
                  <div id="patients" className="tab-content">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Empower Your Health</h3>
                    <p className="text-gray-600 mb-4">Gain ultimate peace of mind. A simple scan of the QR code on your medication's packaging empowers you to confirm its authenticity and see its entire journey, right from your own phone.</p>
                  </div>
                  <div id="tab-image-container">
                    <img src="/Manufacturers Dashboard.png" alt="Manufacturers Dashboard" className="tab-content active rounded-lg shadow-md border border-gray-200" data-tab-img="manufacturers" />
                    <img src="/Logistics Tracking.png" alt="Logistics Tracking" className="tab-content rounded-lg shadow-md border border-gray-200" data-tab-img="distributors" />
                    <img src="/Hospital Inventory.png" alt="Hospital Inventory" className="tab-content rounded-lg shadow-md border border-gray-200" data-tab-img="providers" />
                    <img src="/Patient Verification App.png" alt="Patient Verification App" className="tab-content rounded-lg shadow-md border border-gray-200" data-tab-img="patients" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="py-20 lg:py-32 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-gray-900 mb-4">Built for Trust and Scale.</h2>
                <p className="text-lg text-gray-600">Our enterprise-grade architecture combines the best of blockchain and modern web technologies to deliver a robust and reliable platform.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Blockchain Integrity</h3>
                  <p className="text-gray-600 text-sm">Powered by Polkadot for robust security and interoperability, ensuring every record is immutable.</p>
                </div>
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Instant QR Verification</h3>
                  <p className="text-gray-600 text-sm">Our dynamic QR system connects physical products to their digital twins for foolproof verification.</p>
                </div>
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Alerts</h3>
                  <p className="text-gray-600 text-sm">Integrate with IoT sensors and receive automated alerts for any deviation or unauthorized activity.</p>
                </div>
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0M12 15v-4"></path><path d="M12 7c4.418 0 8 1.79 8 4s-3.582 4-8 4-8-1.79-8-4 3.582-4 8-4z"></path></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Decentralized Storage</h3>
                  <p className="text-gray-600 text-sm">Critical metadata is stored on IPFS, ensuring data permanence and censorship resistance.</p>
                </div>
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                  <p className="text-gray-600 text-sm">Gain insights into your supply chain, predict shortages, and optimize logistics with our data dashboard.</p>
                </div>
                <div className="feature-card text-center p-8 rounded-xl">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mx-auto mb-4 border-2 border-blue-200"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.793V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6.207M15 3h6v6"></path><path d="M10 14L21 3"></path></svg></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Scalability</h3>
                  <p className="text-gray-600 text-sm">Built with a modern stack designed for high performance, security, and global scale from day one.</p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Powered By Enterprise-Grade Technology</h3>
                <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 max-w-5xl mx-auto">
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="Polkadot">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="6" r="2" />
                        <circle cx="6" cy="12" r="2" />
                        <circle cx="18" cy="12" r="2" />
                        <circle cx="12" cy="18" r="2" />
                        <path d="M12 8v4m-4-2h4m0 0h4m-4 0v4" />
                      </svg>
                    </div>
                    <span className="font-medium">Polkadot</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="React">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="1" />
                        <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
                        <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
                      </svg>
                    </div>
                    <span className="font-medium">React</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="Node.js">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM8 8.5l4-2 4 2v7l-4 2-4-2v-7z" />
                      </svg>
                    </div>
                    <span className="font-medium">Node.js</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="Solidity">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 7.5L12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" />
                        <path d="M8 10l4-2 4 2v4l-4 2-4-2v-4z" fill="none" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="font-medium">Solidity</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="MongoDB">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8 2 5 5.5 5 10c0 3 2 6 7 10 5-4 7-7 7-10 0-4.5-3-8-7-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
                      </svg>
                    </div>
                    <span className="font-medium">MongoDB</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors" title="IPFS">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="6" cy="6" r="2" />
                        <circle cx="18" cy="6" r="2" />
                        <circle cx="6" cy="18" r="2" />
                        <circle cx="18" cy="18" r="2" />
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="1" />
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="font-medium">IPFS</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="contact" className="bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
              <div className="cta-gradient rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full"></div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-4">Join Us in Building the Future of Healthcare.</h2>
                  <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-10">Whether you're a developer, a healthcare professional, or a potential partner, your contribution can make a difference. Let's build a safer, more transparent world together.</p>
                  <Link to="/connect" className="bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-lg text-base hover:bg-opacity-90 transition-all duration-300 inline-block shadow-lg">Get Started</Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-16 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-8">
                <img src="logo.svg" alt="Red Médica Logo" className="h-8 w-auto" />
                <span className="ml-3 text-2xl font-bold text-gray-800">Red Médica</span>
              </div>
              <nav className="flex justify-center flex-wrap gap-x-12 gap-y-4 mb-10 text-sm font-medium">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-md hover:bg-gray-50">Dashboard</Link>
                <Link to="/verify" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-md hover:bg-gray-50">Verify</Link>
                <Link to="/analytics" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-md hover:bg-gray-50">Analytics</Link>
                <Link to="/help" className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 rounded-md hover:bg-gray-50">Help</Link>
              </nav>
              <div className="flex justify-center items-center space-x-8 mb-8">
                <a href="https://github.com/nikhlu07/Red-Medica" className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-50">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
              <p className="text-sm text-gray-500">&copy; 2025 Red Médica. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
