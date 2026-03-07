import Footer from "../components/Footer";
import GNB from "../components/Gnb";
import "./Home.css";

function Home() {
  return (
    <>
      <GNB />
      <main className="home-container">
        <h1 className="home-title" aria-label="Kim Yongjun Portfolio">
          <span className="home-title-main">KIM YONGJUN</span>
          <span className="home-title-sub">PORTFOLIO</span>
        </h1>
      </main>
      <Footer />
    </>    
  );
}

export default Home;
