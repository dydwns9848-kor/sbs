import Footer from "../components/Footer";
import GNB from "../components/Gnb";
import "./Home.css";

function Home() {
  return (
    <>
      <GNB />
      <main className="home-container">
        <h1 className="home-title">MY WORK</h1>
      </main>
      <Footer />
    </>    
  );
}

export default Home;
