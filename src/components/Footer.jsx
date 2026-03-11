import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            © 2026 Kim Yongjun Portfolio. All rights reserved.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link">Portfolio</a>
            <span className="footer-separator">|</span>
            <a href="#" className="footer-link">Projects</a>
            <span className="footer-separator">|</span>
            <a href="#" className="footer-link">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
