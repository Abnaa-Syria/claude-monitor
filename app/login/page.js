import { login } from '../actions';

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form action={login}>
        <div className="brand"><span className="brand-dot" /> <span>Claude Monitor</span></div>
        <div className="muted">متابعة استخدام Claude Code للفريق</div>
        <input type="password" name="password" placeholder="كلمة السر" autoFocus required />
        {error && <div className="err">كلمة السر غلط</div>}
        <button className="btn" type="submit">دخول</button>
      </form>
    </main>
  );
}
