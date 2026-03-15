import Footer from "../components/Footer";
import GNB from "../components/Gnb";
import "./Home.css";

const techStacks = [
  {
    category: "SERVICE PLATFORM",
    items: [
      {
        name: "AWS Lightsail",
        logo: "https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-ar21.svg",
        fallbackLogo: "https://cdn.simpleicons.org/aws/FF9900",
      },
    ],
  },
  {
    category: "CODE MANAGEMENT",
    items: [
      {
        name: "Git",
        logo: "https://cdn.simpleicons.org/git/F05032",
      },
      {
        name: "GitHub",
        logo: "https://cdn.simpleicons.org/github/FFFFFF",
      },
    ],
  },
  {
    category: "DEVOPS",
    items: [
      {
        name: "GitHub Actions",
        logo: "https://cdn.simpleicons.org/githubactions/2088FF",
      },
    ],
  },
  {
    category: "BACKEND",
    items: [
      {
        name: "Java",
        logo: "https://www.vectorlogo.zone/logos/java/java-ar21.svg",
        fallbackLogo: "https://cdn.simpleicons.org/openjdk/FFFFFF",
      },
      {
        name: "Spring Framework",
        logo: "https://cdn.simpleicons.org/spring/6DB33F",
      },
      {
        name: "Spring Boot",
        logo: "https://cdn.simpleicons.org/springboot/6DB33F",
      },
      {
        name: "Spring Security",
        logo: "https://cdn.simpleicons.org/spring/6DB33F",
      },
    ],
  },
  {
    category: "DATABASE",
    items: [
      {
        name: "MySQL 8",
        logo: "https://cdn.simpleicons.org/mysql/4479A1",
      },
    ],
  },
  {
    category: "FRONTEND",
    items: [
      {
        name: "React",
        logo: "https://cdn.simpleicons.org/react/61DAFB",
      },
    ],
  },
  {
    category: "DEV TOOLS",
    items: [
      {
        name: "Docker",
        logo: "https://cdn.simpleicons.org/docker/2496ED",
      },
      {
        name: "Postman",
        logo: "https://cdn.simpleicons.org/postman/FF6C37",
      },
      {
        name: "IntelliJ",
        logo: "https://cdn.simpleicons.org/intellijidea/FFFFFF",
      },
      {
        name: "Visual Studio Code",
        logo: "https://raw.githubusercontent.com/devicons/devicon/master/icons/vscode/vscode-original.svg",
        fallbackLogo: "https://cdn.simpleicons.org/visualstudiocode/007ACC",
      },
      {
        name: "Codex",
        logo: "https://api.iconify.design/simple-icons:openai.svg?color=%2310A37F",
        fallbackLogo: "https://cdn.simpleicons.org/openai/10A37F",
      },
    ],
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
            </div>

            <div className="home-stack-grid">
              {techStacks.map((stack) => (
                <article key={stack.category} className="home-stack-card">
                  <h2>{stack.category}</h2>
                  <div className="home-stack-tags">
                    {stack.items.map((item) => (
                      <span key={item.name} className="home-stack-tag">
                        <img
                          src={item.logo}
                          alt={`${item.name} logo`}
                          className="home-stack-logo"
                          loading="lazy"
                          onError={(event) => {
                            if (item.fallbackLogo && event.currentTarget.src !== item.fallbackLogo) {
                              event.currentTarget.src = item.fallbackLogo;
                              return;
                            }
                            event.currentTarget.style.display = "none";
                          }}
                        />
                        {item.name}
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
