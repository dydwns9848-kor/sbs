import Footer from "../components/Footer";
import GNB from "../components/Gnb";
import "./Home.css";

const techStacks = [
  {
    category: "SERVICE PLATFORM",
    items: ["AWS Lightsail"],
  },
  {
    category: "CODE MANAGEMENT",
    items: ["Git", "GitHub"],
  },
  {
    category: "DEVOPS",
    items: ["GitHub Actions"],
  },
  {
    category: "BACKEND",
    items: ["Java", "Spring Framework", "Spring Boot", "Spring Security"],
  },
  {
    category: "DATABASE",
    items: ["MySQL 8"],
  },
  {
    category: "FRONTEND",
    items: ["React"],
  },
  {
    category: "DEV TOOLS",
    items: ["Docker", "Postman", "IntelliJ", "Visual Studio Code", "Codex"],
  },
];

function Home() {
  return (
    <>
      <GNB />
      <main className="home-container">
        <section className="home-hero">
          <h1 className="home-title" aria-label="Kim Yongjun Portfolio">
            <span className="home-title-main">KIM YONGJUN</span>
            <span className="home-title-sub">PORTFOLIO</span>
          </h1>

          <div className="home-stack-shell" aria-label="Technology Stack">
            <div className="home-stack-intro">
              <span className="home-stack-kicker">TECH STACK</span>
              <p>
                Built with a backend-first mindset, shipped with practical tooling,
                and designed to scale as a real product.
              </p>
            </div>

            <div className="home-stack-grid">
              {techStacks.map((stack) => (
                <article key={stack.category} className="home-stack-card">
                  <h2>{stack.category}</h2>
                  <div className="home-stack-tags">
                    {stack.items.map((item) => (
                      <span key={item} className="home-stack-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>    
  );
}

export default Home;
