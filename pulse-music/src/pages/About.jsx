import { Link } from 'react-router-dom';
import '../styles/about.css';

function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>PULSE AI: Personal Unleashed AI</h1>
        <div className="neon-underline"></div>
        <p className="hero-description">
          PULSE AI is a revolutionary music platform powered by our Personal Unleashed AI, designed to
          personalize your music experience and unleash your creativity. With Tune-Genie, our AI music
          generator, create unique, royalty-free tracks in seconds. Discover, stream, and share music
          like never before in a vibrant, neon-lit community.
        </p>
      </div>

      <div className="about-container">
        <section className="about-section section--fade-in section--left">
          <div className="section-content">
            <h2>Our Story</h2>
            <p>
              Launched in 2023, PULSE AI was born from a vision to redefine music interaction through
              artificial intelligence. Our team of developers, designers, and music enthusiasts built
              PULSE AI to empower users with personalized recommendations and creative tools like
              Tune-Genie. Whether you're a listener, creator, or both, PULSE AI connects you to music
              in a way that's uniquely yours.
            </p>
          </div>
          <div className="section-visual">
            <img src="/assets/icons/story-icon.png" alt="Our Story" className="section-image" />
          </div>
        </section>

        <section className="about-section section--fade-in section--right">
          <div className="section-visual">
            <img src="/assets/icons/pulse-icon.png" alt="PULSE AI" className="section-image" />
          </div>
          <div className="section-content">
            <h2>PULSE AI: The Core</h2>
            <p>
              PULSE AI (Personal Unleashed AI) is the heart of our platform, leveraging advanced machine
              learning to understand your music preferences, moods, and creative needs. It powers
              personalized playlists, smart recommendations, and seamless integration with Tune-Genie
              for music generation. Built with scalability in mind, PULSE AI adapts to your evolving
              taste, making every interaction feel personal and intuitive.
            </p>
          </div>
        </section>

        <section className="about-section section--fade-in section--left">
          <div className="section-content">
            <h2>Tune-Genie: Your Music Creator</h2>
            <p>
              Tune-Genie, a component of PULSE AI, transforms your ideas into royalty-free music. Input
              text prompts (e.g., "upbeat pop, 120 BPM") or lyrics, and Tune-Genie generates
              professional-quality tracks with mood-based cover art (upbeat, chill, epic). Integrated
              with our chat UI, it’s perfect for content creators, filmmakers, and music enthusiasts.
              All tracks are stored securely in Firebase Firestore and playable via our neon-styled
              music player.
            </p>
          </div>
          <div className="section-visual">
            <img src="/assets/icons/tune-genie-icon.png" alt="Tune-Genie" className="section-image" />
          </div>
        </section>

        <section className="about-section section--fade-in section--right">
          <div className="section-visual">
            <img src="/assets/icons/offerings-icon.png" alt="What We Offer" className="section-image" />
          </div>
          <div className="section-content">
            <h2>What We Offer</h2>
            <ul className="values-list">
              <li>
                <strong>Personalized Streaming</strong>: Curated playlists and recommendations powered
                by PULSE AI, tailored to your mood and listening history.
              </li>
              <li>
                <strong>AI Music Generation</strong>: Create unique tracks with Tune-Genie, royalty-free
                for personal and commercial use (e.g., YouTube, TikTok).
              </li>
              <li>
                <strong>Local Track Integration</strong>: Upload and stream your SSD tracks alongside
                AI-generated music, all in one platform.
              </li>
              <li>
                <strong>Vibrant Community</strong>: Share tracks, collaborate with creators, and join
                our neon-lit music ecosystem.
              </li>
              <li>
                <strong>Seamless Experience</strong>: Intuitive UI, high-quality audio, and real-time
                playback with our React-based player.
              </li>
            </ul>
          </div>
        </section>

        <section className="about-section section--fade-in section--full developer-section">
          <h2>From a Developer’s Lens</h2>
          <p>
            PULSE AI is built on a modern tech stack: Vite and React for a blazing-fast frontend,
            Firebase for authentication and Firestore for storing user sessions and AI-generated
            tracks, and a Node.js backend (<code>http://localhost:8000</code>) for audio processing.
            Tune-Genie uses machine learning models inspired by tools like MusicGen, trained on diverse
            music datasets to generate high-quality tracks. We tackled challenges like real-time
            playback (using <code>playerRef</code>), mood-based cover assignment, and Firestore
            scalability. Our neon aesthetic (#00ff99, #f5f5f5) is enhanced with Three.js animations and
            CSS glow effects, ensuring a visually stunning experience.
          </p>
          <p>
            Key innovations include:
          </p>
          <ul className="values-list">
            <li>
              <strong>Hybrid Track Management</strong>: Seamlessly blends Firestore tracks with local
              SSD files in <code>Music.jsx</code>.
            </li>
            <li>
              <strong>Mood-Based Covers</strong>: Assigns neon-themed cover art (upbeat, chill, epic)
              based on text prompts or track index.
            </li>
            <li>
              <strong>Robust Playback</strong>: Fixes for <code>TypeError</code> and playback
              interruptions ensure smooth streaming in <code>MusicPlayer.jsx</code>.
            </li>
          </ul>
        </section>

        <section className="about-section section--fade-in section--full future-section">
          <h2>Future Scope</h2>
          <p>
            PULSE AI is just the beginning. Our roadmap includes:
          </p>
          <ul className="values-list">
            <li>
              <strong>Advanced Personalization</strong>: Enhance PULSE AI with deep learning to analyze
              listening patterns and predict user preferences.
            </li>
            <li>
              <strong>Playlist Creation</strong>: Allow users to save and share AI-generated and local
              tracks as playlists, stored in Firestore.
            </li>
            <li>
              <strong>Social Features</strong>: Enable track sharing, creator profiles, and
              collaborative music generation via chat UI.
            </li>
            <li>
              <strong>API Integration</strong>: Offer a public API for developers to integrate
              Tune-Genie into their apps, similar to xAI’s API.
            </li>
            <li>
              <strong>Multi-Platform Support</strong>: Expand to iOS/Android apps with offline playback
              and voice-activated Tune-Genie prompts.
            </li>
            <li>
              <strong>Extended Music Styles</strong>: Train Tune-Genie on classical, jazz, and
              experimental genres for broader creativity.
            </li>
            <li>
              <strong>VR/AR Integration</strong>: Create immersive music experiences with Three.js and
              WebXR, aligning with our neon aesthetic.
            </li>
          </ul>
          <p>
            We’re also exploring partnerships with platforms like Spotify for playlist imports and
            Beatoven.ai for enhanced stem generation, ensuring PULSE AI remains a leader in AI-driven
            music innovation.
          </p>
        </section>

        <section className="cta-section section--fade-in">
          <h2>Join the PULSE AI Revolution</h2>
          <p>
            Unleash your creativity with PULSE AI and Tune-Genie. Create, stream, and share music in
            our neon-lit community today!
          </p>
          <div className="cta-buttons">
            <Link to="/music" className="btn btn-primary btn--pulse">Explore Music</Link>
            <Link to="/chat" className="btn btn-secondary btn--pulse">Try Tune-Genie</Link>
            <Link to="/contact" className="btn btn-secondary btn--pulse">Get in Touch</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;