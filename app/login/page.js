import { login } from '../actions';

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form action={login}>
        <div className="brand">
          <span className="brand-mark"><img src="/qt.png" alt="" /></span>
          <span><div className="brand-name">Claude Monitor</div><div className="brand-sub" style={{ color: '#a7b5cc' }}>قيمة تك · متابعة الفريق</div></span>
        </div>
        <p>متابعة استخدام Claude Code لكل المطوّرين والمنظمات.</p>
        <input className="input" type="password" name="password" placeholder="كلمة السر" autoFocus required />
        {error && <div className="err">كلمة السر غير صحيحة</div>}
        <button className="btn primary" type="submit">دخول</button>
      </form>
    </main>
  );
}
