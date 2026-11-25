import { uiText } from '../i18n'
import { useState } from 'react'
import { Mars, Venus } from 'lucide-react'
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
  const field = `${fieldClass} mt-2 w-full`
  const submit = () => {
    if (!/^\d{6,15}$/.test(phone.trim())) return setError(uiText(lang, 'enter_a_6_15_digit_contact_number_9f5f5'))
    if (password.length < 6 || password.length > 20) return setError(uiText(lang, 'password_must_be_6_20_characters_c69f3'))
      if (screen === 'register') {
      if (password !== confirm) return setError(uiText(lang, 'passwords_do_not_match_8d302'))
      if (!name.trim()) return setError(uiText(lang, 'enter_your_name_b0425'))
      if (!agreed) return setError(uiText(lang, 'please_agree_to_the_terms_b4e91'))
      onRegister({ name: name.trim(), phone: phone.trim(), code, password })
      onClose()
    } else if (screen === 'login') {
      if (!member || member.phone !== phone.trim() || member.code !== code || member.password !== password) return setError(uiText(lang, 'contact_number_or_password_is_incorrec_f034f'))
      onRegister(member)
      onClose()
    } else {
      if (!member || member.password !== password) return setError(uiText(lang, 'current_password_is_incorrect_d2ebd'))
      if (confirm.length < 6 || confirm.length > 20) return setError(uiText(lang, 'new_password_must_be_6_20_characters_f95b8'))
      onRegister({ ...member, password: confirm })
      setScreen('profile'); setError(''); setNotice(uiText(lang, 'password_updated_04d31'))
    }
  }
  const title = screen === 'register' ? (uiText(lang, 'join_membership_21f6e')) : screen === 'login' ? (uiText(lang, 'member_login_e347c')) : screen === 'password' ? (uiText(lang, 'change_password_5067f')) : (uiText(lang, 'membership_61e33'))
  return <Page className="member-page" title={title} onBack={screen === 'password' ? () => setScreen('profile') : onClose} footer={screen !== 'profile' ? <Button className="w-full" onClick={submit}>{screen === 'register' ? (uiText(lang, 'register_04b0a')) : screen === 'login' ? (uiText(lang, 'log_in_4c2e9')) : (uiText(lang, 'save_8c556'))}</Button> : undefined}>
    {screen === 'profile' && member ? <Section><h2 className="text-title font-semibold">{member.name}</h2><p className="mt-1 text-ink-2">{uiText(lang, 'member_7930b')}</p><div className="mt-5 rounded-lg bg-tile p-4">{uiText(lang, 'points_0_balance_0_35681')}</div><TextButton size="body" className="mt-5 w-full text-left" onClick={() => { setScreen('password'); setPhone(member.phone); setCode(member.code); setPassword(''); setConfirm('') }}>{uiText(lang, 'change_password_5067f')} ›</TextButton><TextButton size="body" className="w-full text-left" onClick={() => { onLogout(); setScreen('login'); setPassword(''); setError('') }}>{uiText(lang, 'log_out_19b5f')} ›</TextButton>{notice && <InlineAlert tone="success" title={notice} className="mt-3" />}</Section> : <>
      <Section>{screen === 'register' && <TextButton compact tone="brandStrong" size="body" className="member-switch" onClick={() => { setScreen('login'); setError('') }}>{uiText(lang, 'already_a_member_log_in_033ef')} ›</TextButton>}
        {screen === 'login' && <TextButton compact tone="brandStrong" size="body" className="member-switch" onClick={() => { setScreen('register'); setError('') }}>{uiText(lang, 'join_membership_98b58')} ›</TextButton>}
      </Section>
      <Section><label className="block text-callout">{uiText(lang, 'contact_number_83e9a')}<div className="flex gap-2"><select aria-label={uiText(lang, 'country_code_4f71e')} value={code} onChange={e => setCode(e.target.value)} className={`${field} member-country-code`}>{['+86','+852','+853','+886','+81','+82','+66'].map(c => <option key={c}>{c}</option>)}</select><input aria-label={uiText(lang, 'contact_number_83e9a')} className={`${field} min-w-0 flex-1`} inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} /></div></label>
        <label className="mt-4 block text-callout">{screen === 'password' ? (uiText(lang, 'current_password_bbd3c')) : (screen === 'register' ? uiText(lang, 'password_03587') : uiText(lang, 'password_7c9bd'))}<input className={field} type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {(screen === 'register' || screen === 'password') && <label className="mt-4 block text-callout">{screen === 'password' ? (uiText(lang, 'new_password_5166f')) : (uiText(lang, 'confirm_password_5b227'))}<input className={field} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
        {screen === 'register' && <><label className="mt-4 block text-callout">{uiText(lang, 'name_fb409')}<input className={field} value={name} onChange={e => setName(e.target.value)} /></label><label className="mt-4 block text-callout">{uiText(lang, 'birthday_optional_bff1e')}<input className={field} type="date" value={birth} onChange={e => setBirth(e.target.value)} /></label><div className="mt-4 text-callout">{uiText(lang, 'gender_optional_18529')}<div className="mt-2 flex gap-2">{[{ id: 'female', text: uiText(lang, 'female_3038a') }, { id: 'male', text: uiText(lang, 'male_9b917') }].map(g => <OptionChip className="member-gender-option" key={g.id} active={gender === g.id} onClick={() => setGender(g.id)}>{g.id === 'female' ? <Venus aria-hidden="true" size={20} /> : <Mars aria-hidden="true" size={20} />}<span className="sr-only">{g.text}</span></OptionChip>)}</div></div><label className="mt-5 flex items-start gap-2 text-callout"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-brand" checked={agreed} onChange={e => setAgreed(e.target.checked)} />{uiText(lang, 'i_agree_to_the_membership_terms_and_pe_021f4')}</label></>}
        {screen === 'login' && <TextButton compact tone="brandStrong" size="body" className="mt-4" onClick={() => setNotice(uiText(lang, 'please_ask_staff_to_reset_your_passwor_88194'))}>{uiText(lang, 'forgot_password_a25d3')}</TextButton>}
        {notice && <InlineAlert tone="success" title={notice} className="mt-3" />}{error && <InlineAlert tone="danger" title={error} className="mt-3" />}
      </Section>
    </>}
  </Page>
}
