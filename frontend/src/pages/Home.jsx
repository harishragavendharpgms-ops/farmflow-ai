import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* NAVIGATION */}
      <header className="home-nav">

        <div
          className="home-brand"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
        >
          <span>🌱</span>
          FarmFlow <b>AI</b>
        </div>

        <div className="home-nav-actions">
          <button
            className="home-nav-login"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>

          <button
            className="home-nav-cta"
            onClick={() => navigate('/register')}
          >
            Create account
          </button>
        </div>

      </header>

      <main>

        {/* HERO */}
        <section className="home-hero">

          <div className="home-hero-copy">

            <div className="home-eyebrow">
              SMART AGRICULTURE PLATFORM
            </div>

            <h1>
              Better decisions for{' '}
              <span>every harvest.</span>
            </h1>

            <p>
              FarmFlow AI brings market intelligence, weather
              signals, procurement workflows and land-document
              verification into one simple workspace for farmers
              and field officers.
            </p>

            <div className="home-actions">

              <button
                className="home-primary"
                onClick={() => navigate('/register')}
              >
                Get started
                <span>→</span>
              </button>

              <button
                className="home-secondary"
                onClick={() => navigate('/login')}
              >
                I already have an account
              </button>

            </div>

            <div className="home-trust">
              <span>✓</span>
              Secure role-based access

              <span>✓</span>
              Live market & weather data
            </div>

          </div>

          {/* INTELLIGENCE PREVIEW */}
          <div className="home-hero-panel">

            <div className="home-panel-glow"></div>

            <div className="home-panel-top">
              <span>Farm intelligence</span>

              <span className="live-dot">
                ● LIVE
              </span>
            </div>

            <div className="home-metric">

              <div>
                <small>
                  Today's market signal
                </small>

                <strong>
                  Favourable
                </strong>

                <em>
                  ↑ 8.4% opportunity
                </em>
              </div>

              <div className="metric-chart">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>

            </div>

            <div className="home-panel-grid">

              <div>
                <span>🌤️</span>

                <small>
                  Weather
                </small>

                <b>
                  Good for field work
                </b>
              </div>

              <div>
                <span>📦</span>

                <small>
                  Procurement
                </small>

                <b>
                  3 active applications
                </b>
              </div>

            </div>

            <div className="home-ai-note">

              <span>✦</span>

              <div>
                <b>
                  AI recommendation
                </b>

                <p>
                  Review wheat rates before
                  confirming your next delivery slot.
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* SERVICES */}
        <section className="home-services">

          <div className="section-heading">

            <div>
              <span>
                ONE PLATFORM
              </span>

              <h2>
                Everything your farm
                workflow needs.
              </h2>
            </div>

            <p>
              Designed to reduce paperwork,
              improve visibility and help
              teams act faster.
            </p>

          </div>

          <div className="service-grid">

            <article>
              <div className="service-icon">
                📈
              </div>

              <h3>
                Market intelligence
              </h3>

              <p>
                Track crop rates and trends
                so you can make better selling
                and procurement decisions.
              </p>
            </article>

            <article>
              <div className="service-icon">
                🤖
              </div>

              <h3>
                AI insights
              </h3>

              <p>
                Turn weather and market signals
                into practical recommendations
                for the week ahead.
              </p>
            </article>

            <article>
              <div className="service-icon">
                🧾
              </div>

              <h3>
                Digital verification
              </h3>

              <p>
                Move land documents and applications
                through farmer, VAO and officer workflows.
              </p>
            </article>

          </div>

        </section>

        {/* LAND SERVICES */}
        <section className="home-land">

          <div>

            <div className="land-tag">
              OFFICIAL SERVICES
            </div>

            <h2>
              Land records, one click away.
            </h2>

            <p>
              Access the Tamil Nadu e-Services
              portal for land ownership, Patta
              and Chitta records.
            </p>

          </div>

          <a
            href="https://eservices.tn.gov.in/eservicesnew/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open TN e-Services ↗
          </a>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="home-footer">

        <div>
          🌱 <strong>FarmFlow AI</strong>
        </div>

        <p>
          Smarter agriculture. Simpler workflows.
        </p>

      </footer>

    </div>
  );
};

export default Home;