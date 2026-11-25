import Link from 'next/link';
import { logout } from './actions';
import { qs } from '../lib/api';

export function Shell({ children }) {
  return (
    <>
      <header className="top">
        <div className="top-inner">
          <Link href="/" className="brand"><span className="brand-dot" /> <span>Claude Monitor</span></Link>
          <nav className="nav">
            <Link href="/">نظرة عامة</Link>
            <Link href="/sessions">السيشنز</Link>
          </nav>
          <form action={logout}><button className="linkbtn" type="submit">خروج</button></form>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

const RANGES = [['1', 'اليوم'], ['7', '7 أيام'], ['30', '30 يوم'], ['90', '90 يوم'], ['3650', 'الكل']];

export function RangePicker({ base, params }) {
  const cur = params.days || '30';
  return (
    <div className="seg">
      {RANGES.map(([d, label]) => (
        <Link key={d} className={cur === d ? 'on' : ''} href={base + qs({ ...params, days: d })}>{label}</Link>
      ))}
    </div>
  );
}
