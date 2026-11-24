import { useState } from 'react'
import { Button, InlineAlert, OptionChip, Page, Section, TextButton, fieldClass } from './ui'
import type { Lang } from '../data'

export type Member = { name: string; phone: string; code: string; password: string }
type Props = { lang: Lang; member: Member | null; loggedIn: boolean; onRegister: (member: Member) => void; onLogout: () => void; onClose: () => void }

export function MemberPage({ lang, member, loggedIn, onRegister, onLogout, onClose }: Props) {
  const [screen, setScreen] = useState<'register' | 'login' | 'profile' | 'password'>(loggedIn ? 'profile' : 'register')
  const [code, setCode] = useState('+852')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')
  const [gender, setGender] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const en = lang === 'en'
  const field = `${fieldClass} mt-2 w-full`
  const submit = () => {
    if (!/^\d{6,15}$/.test(phone.trim())) return setError(en ? 'Enter a 6–15 digit contact number' : '請輸入 6–15 位聯絡方式')
    if (password.length < 6 || password.length > 20) return setError(en ? 'Password must be 6–20 characters' : '請設定 6–20 位密碼')
      if (screen === 'register') {
      if (password !== confirm) return setError(en ? 'Passwords do not match' : '兩次輸入的密碼不一致')
      if (!name.trim()) return setError(en ? 'Enter your name' : '請輸入姓名')
      if (!agreed) return setError(en ? 'Please agree to the terms' : '請先同意會員計劃條款及個人資料收集聲明')
      onRegister({ name: name.trim(), phone: phone.trim(), code, password })
      onClose()
    } else if (screen === 'login') {
      if (!member || member.phone !== phone.trim() || member.code !== code || member.password !== password) return setError(en ? 'Contact number or password is incorrect' : '聯絡方式或密碼不正確')
      onRegister(member)
      onClose()
    } else {
      if (!member || member.password !== password) return setError(en ? 'Current password is incorrect' : '原密碼不正確')
      if (confirm.length < 6 || confirm.length > 20) return setError(en ? 'New password must be 6–20 characters' : '新密碼須為 6–20 位')
      onRegister({ ...member, password: confirm })
      setScreen('profile'); setError(''); setNotice(en ? 'Password updated' : '密碼已修改')
    }
  }
  const title = screen === 'register' ? (en ? 'Join membership' : '註冊會員') : screen === 'login' ? (en ? 'Member login' : '會員登入') : screen === 'password' ? (en ? 'Change password' : '修改密碼') : (en ? 'Membership' : '會員中心')
  return <Page title={title} onBack={screen === 'password' ? () => setScreen('profile') : onClose} footer={screen !== 'profile' ? <Button className="w-full" onClick={submit}>{screen === 'register' ? (en ? 'Register' : '完成註冊') : screen === 'login' ? (en ? 'Log in' : '登入') : (en ? 'Save' : '確認修改')}</Button> : undefined}>
    {screen === 'profile' && member ? <Section><h2 className="text-title font-semibold">{member.name}</h2><p className="mt-1 text-ink-2">{en ? 'Member' : '初級會員'}</p><div className="mt-5 rounded-lg bg-tile p-4">{en ? 'Points 0 · Balance $0' : '積分 0　·　餘額 $0'}</div><TextButton size="body" className="mt-5 w-full text-left" onClick={() => { setScreen('password'); setPhone(member.phone); setCode(member.code); setPassword(''); setConfirm('') }}>{en ? 'Change password' : '修改密碼'} ›</TextButton><TextButton size="body" className="w-full text-left" onClick={() => { onLogout(); setScreen('login'); setPassword(''); setError('') }}>{en ? 'Log out' : '退出登入'} ›</TextButton>{notice && <InlineAlert tone="success" title={notice} className="mt-3" />}</Section> : <>
      <Section>{screen === 'register' && <TextButton compact tone="brandStrong" size="body" className="mb-5" onClick={() => { setScreen('login'); setError('') }}>{en ? 'Already a member? Log in' : '已是會員？點擊登入'} ›</TextButton>}
        {screen === 'login' && <TextButton compact tone="brandStrong" size="body" className="mb-5" onClick={() => { setScreen('register'); setError('') }}>{en ? 'Join membership' : '加入會員'} ›</TextButton>}
        <p className="text-caption text-ink-2">{screen === 'register' ? 'JOIN US' : 'WELCOME BACK'}</p><h2 className="mt-2 text-title font-semibold">{title}</h2>
        <p className="mt-2 text-callout text-ink-2">{en ? 'This is a local prototype, not a real membership service.' : '此為本機原型演示，並非真實會員服務。'}</p>
      </Section>
      <Section><label className="block text-callout">{en ? 'Contact number' : '聯絡方式'}<div className="flex gap-2"><select aria-label={en ? 'Country code' : '地區區號'} value={code} onChange={e => setCode(e.target.value)} className={`${field} w-24`}>{['+86','+852','+853','+886','+81','+82','+66'].map(c => <option key={c}>{c}</option>)}</select><input aria-label={en ? 'Contact number' : '聯絡方式'} className={field} inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} /></div></label>
        <label className="mt-4 block text-callout">{screen === 'password' ? (en ? 'Current password' : '原密碼') : (en ? 'Password' : screen === 'register' ? '設定密碼' : '密碼')}<input className={field} type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {(screen === 'register' || screen === 'password') && <label className="mt-4 block text-callout">{screen === 'password' ? (en ? 'New password' : '新密碼') : (en ? 'Confirm password' : '確認密碼')}<input className={field} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
        {screen === 'register' && <><label className="mt-4 block text-callout">{en ? 'Name' : '姓名'}<input className={field} value={name} onChange={e => setName(e.target.value)} /></label><label className="mt-4 block text-callout">{en ? 'Birthday (optional)' : '生日（選填）'}<input className={field} type="date" value={birth} onChange={e => setBirth(e.target.value)} /></label><div className="mt-4 text-callout">{en ? 'Gender (optional)' : '性別（選填）'}<div className="mt-2 flex gap-2">{['女','男'].map(g => <OptionChip key={g} active={gender === g} onClick={() => setGender(g)}>{g}</OptionChip>)}</div></div><label className="mt-5 flex items-start gap-2 text-callout"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand" checked={agreed} onChange={e => setAgreed(e.target.checked)} />{en ? 'I agree to the membership terms and personal data statement' : '我已閱讀並同意《會員計劃條款及細則》及《個人資料收集聲明》'}</label></>}
        {screen === 'login' && <TextButton compact tone="brandStrong" size="body" className="mt-4" onClick={() => setNotice(en ? 'Please ask staff to reset your password.' : '請聯絡服務員重置密碼。')}>{en ? 'Forgot password?' : '忘記密碼？'}</TextButton>}
        {notice && <InlineAlert tone="success" title={notice} className="mt-3" />}{error && <InlineAlert tone="danger" title={error} className="mt-3" />}
      </Section>
    </>}
  </Page>
}
