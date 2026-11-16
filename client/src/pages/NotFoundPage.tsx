import { LinkButton } from '../components/Button';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="not-found__code">404</p>
      <h1 className="page-title">This page took a rest day</h1>
      <p className="not-found__text">The link may be broken, or the page moved.</p>
      <LinkButton to="/">Back to home</LinkButton>
    </main>
  );
}
