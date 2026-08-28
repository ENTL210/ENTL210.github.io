import "./ComingSoon.css";

export default function ComingSoon() {
  return (
    <main className="coming-soon">
      <p className="coming-soon__text">
        Coming soon
        <span className="coming-soon__dots" aria-hidden="true">
          <span className="coming-soon__dot">.</span>
          <span className="coming-soon__dot">.</span>
          <span className="coming-soon__dot">.</span>
        </span>
      </p>
    </main>
  );
}
