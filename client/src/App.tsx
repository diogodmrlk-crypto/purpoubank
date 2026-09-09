import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  DollarSign,
  Eye,
  EyeOff,
  Gift,
  Grid2X2,
  Landmark,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  QrCode,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Send,
  Smartphone,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import "./index.css";
import "./light-overrides.css";
import "./receipt-overrides.css";
import "./home-reference-overrides.css";

type Screen =
  | "splash"
  | "home"
  | "pix-search"
  | "pix-amount"
  | "pix-review"
  | "pix-pin"
  | "processing"
  | "success";
type EditField = "name" | "balance" | null;
type PixInfo = { display: string; type: string; institution: string; key: string };

const contacts = [
  { initials: "FV", name: "Fábio Vieira", meta: "RECARGA" },
  { initials: "FD", name: "Flávio Duarte", meta: "BANCO INTER" },
  { initials: "LF", name: "Luís Fernando", meta: "BCO. DO BRASIL" },
];

function formatCurrency(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");
  if (!normalized) return "R$ 0,00";
  const cents = Number(normalized) / 100;
  return cents.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toCents(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");
  return Number(normalized || "0");
}

function maskPixInput(value: string) {
  if (/[A-Za-z@]/.test(value)) return value;
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function resolvePixKey(raw: string): PixInfo {
  const value = raw.trim();
  const digits = value.replace(/\D/g, "");
  if (/^\d{11}$/.test(digits)) {
    const cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    return { display: cpf, type: "CPF", institution: "Instituição a confirmar", key: cpf };
  }
  if (value.includes("@")) return { display: value.toLowerCase(), type: "E-mail", institution: "Instituição a confirmar", key: value.toLowerCase() };
  const display = value ? value.toUpperCase() : "QUALQUER CHAVE";
  return { display, type: "Chave Pix", institution: "Instituição a confirmar", key: display };
}

function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [name, setName] = useState(() => localStorage.getItem("purpou-name") || "felipe");
  const [balance, setBalance] = useState(() => localStorage.getItem("purpou-balance") || "40000");
  const [hiddenBalance, setHiddenBalance] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("50000");
  const [pin, setPin] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const formattedBalance = useMemo(() => formatCurrency(balance), [balance]);
  const formattedAmount = useMemo(() => formatCurrency(amount), [amount]);
  const pixInfo = useMemo(() => resolvePixKey(pixKey), [pixKey]);
  const recipient = pixInfo.display;

  useEffect(() => {
    const timer = window.setTimeout(() => setScreen("home"), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("purpou-name", name);
    localStorage.setItem("purpou-balance", balance);
  }, [name, balance]);

  useEffect(() => {
    if (toast === null) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (screen !== "processing") return;
    setProcessingStep(0);
    const first = window.setTimeout(() => setProcessingStep(1), 1250);
    const second = window.setTimeout(() => setScreen("success"), 2700);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [screen]);

  function openEditor(field: Exclude<EditField, null>) {
    setEditField(field);
    setEditValue(field === "name" ? name : balance === "40000" ? "400" : formatCurrency(balance).replace("R$", "").trim());
  }

  function saveEditor() {
    if (!editField || !editValue.trim()) return;
    if (editField === "name") {
      setName(editValue.trim().toLowerCase());
      setToast("Nome atualizado");
    } else {
      setBalance(String(Math.round(Number(editValue.replace(/\./g, "").replace(",", ".")) * 100)) || "0");
      setToast("Saldo atualizado");
    }
    setEditField(null);
  }

  function startPix() {
    setPixKey("");
    setScreen("pix-search");
  }

  function nextAmount() {
    if (toCents(amount) <= 0) {
      setToast("Digite um valor para continuar");
      return;
    }
    setScreen("pix-review");
  }

  function addDigit(digit: string) {
    setAmount((current) => `${current.replace(/[^0-9]/g, "")}${digit}`.replace(/^0+(?=\d)/, "").slice(-9));
  }

  function removeDigit() {
    setAmount((current) => current.replace(/[^0-9]/g, "").slice(0, -1) || "0");
  }

  function startTransfer() {
    setPin("");
    setScreen("pix-pin");
  }

  function addPinDigit(digit: string) {
    setPin((current) => current.length < 4 ? `${current}${digit}` : current);
  }

  function submitPin() {
    if (pin.length < 4) {
      setToast("Digite os 4 dígitos para continuar");
      return;
    }
    setScreen("processing");
  }

  function goHome() {
    setPin("");
    setScreen("home");
  }

  if (screen === "splash") {
    return (
      <main className="app-shell splash-shell">
        <div className="splash-mark">nu</div>
        <div className="splash-loader"><span /></div>
        <p className="splash-caption">Seu banco digital</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {screen === "home" && (
        <HomeScreen
          name={name}
          balance={formattedBalance}
          hiddenBalance={hiddenBalance}
          onToggleBalance={() => setHiddenBalance((current) => !current)}
          onEditName={() => openEditor("name")}
          onEditBalance={() => openEditor("balance")}
          onStartPix={startPix}
          onHelp={() => setToast("Tudo certo. Este é um ambiente de demonstração.")}
          onGift={() => setToast("Convites em breve")}
          onAction={(label) => setToast(`${label}: disponível na sua conta`)}
        />
      )}

      {screen === "pix-search" && (
        <PixSearchScreen
          value={pixKey}
          setValue={setPixKey}
          onBack={goHome}
          onContinue={() => {
            if (!pixKey.trim()) {
              setToast("Digite uma chave Pix");
              return;
            }
            setScreen("pix-amount");
          }}
          onPickContact={(contact) => {
            setPixKey(contact.name);
            setToast(`${contact.name} selecionado`);
          }}
        />
      )}

      {screen === "pix-amount" && (
        <AmountScreen
          pixInfo={pixInfo}
          amount={formattedAmount}
          onBack={() => setScreen("pix-search")}
          onDigit={addDigit}
          onDelete={removeDigit}
          onContinue={nextAmount}
        />
      )}

      {screen === "pix-review" && (
        <ReviewScreen
          pixInfo={pixInfo}
          amount={formattedAmount}
          onBack={() => setScreen("pix-amount")}
          onContinue={startTransfer}
        />
      )}

      {screen === "pix-pin" && (
        <PinScreen
          pin={pin}
          onBack={() => setScreen("pix-review")}
          onDigit={addPinDigit}
          onDelete={() => setPin((current) => current.slice(0, -1))}
          onContinue={submitPin}
        />
      )}

      {screen === "processing" && <ProcessingScreen step={processingStep} />}

      {screen === "success" && (
        <SuccessScreen
          pixInfo={pixInfo}
          amount={formattedAmount}
          onReceipt={() => setReceiptOpen(true)}
          onFinish={goHome}
        />
      )}

      {editField && (
        <EditModal
          field={editField}
          value={editValue}
          setValue={setEditValue}
          onClose={() => setEditField(null)}
          onSave={saveEditor}
        />
      )}

      {receiptOpen && (
        <ReceiptModal pixInfo={pixInfo} amount={formattedAmount} onClose={() => setReceiptOpen(false)} />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function StatusBar() {
  return null;
}

function TopBar({ onBack, light = false }: { onBack?: () => void; light?: boolean }) {
  return (
    <div className={`top-bar ${light ? "top-bar-light" : ""}`}>
      {onBack ? <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button> : <div className="top-spacer" />}
      <div className="top-brand">nu</div>
      <div className="top-spacer" />
    </div>
  );
}

function HomeScreen({
  name,
  balance,
  hiddenBalance,
  onToggleBalance,
  onEditName,
  onEditBalance,
  onStartPix,
  onHelp,
  onGift,
  onAction,
}: {
  name: string;
  balance: string;
  hiddenBalance: boolean;
  onToggleBalance: () => void;
  onEditName: () => void;
  onEditBalance: () => void;
  onStartPix: () => void;
  onHelp: () => void;
  onGift: () => void;
  onAction: (label: string) => void;
}) {
  const actions = [
    { label: "Área Pix e\nTransferir", icon: Grid2X2, action: onStartPix },
    { label: "Pagar", icon: ScanLine, action: () => onAction("Pagar") },
    { label: "Pegar\nemprestado", icon: Landmark, action: () => onAction("Empréstimo") },
    { label: "Recarga de\ncelular", icon: Smartphone, action: () => onAction("Recarga") },
    { label: "Caixinha e\nInvestir", icon: WalletCards, action: () => onAction("Investimentos") },
  ];

  return (
    <div className="home-screen">
      <section className="hero-panel">
        <StatusBar />
        <div className="hero-actions">
          <button className="avatar-button" aria-label="Perfil"><UserRound size={19} /></button>
          <div className="hero-actions-right">
            <button className="circle-action" onClick={onToggleBalance} aria-label="Ocultar saldo">{hiddenBalance ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            <button className="circle-action" onClick={onHelp} aria-label="Ajuda"><CircleHelp size={19} /></button>
            <button className="circle-action" onClick={onGift} aria-label="Verificação"><ShieldCheck size={20} /></button>
          </div>
        </div>
        <button className="greeting" onClick={onEditName}>Olá, {name}<span className="edit-dot" /></button>
      </section>

      <section className="home-content">
        <div className="balance-head">
          <button className="balance-row" onClick={onEditBalance}>
            <div><span className="eyebrow">Saldo em conta</span><strong>{hiddenBalance ? "R$ •••••" : balance}</strong></div>
            <ChevronRight size={18} />
          </button>
          <button className="link-account" onClick={() => onAction("Vincular conta")}><Plus size={13} /> Vincular conta</button>
        </div>

        <div className="action-scroller">
          {actions.map(({ label, icon: Icon, action }, actionIndex) => (
            <button className="action-item" onClick={action} key={label}>
              <span className="action-circle"><Icon size={25} strokeWidth={1.55} />{actionIndex === 2 && <em className="action-badge">FGTS</em>}</span>
              <span>{label.split("\n").map((part, index) => <span key={part}>{index > 0 && <br />}{part}</span>)}</span>
            </button>
          ))}
        </div>

        <button className="simple-row" onClick={() => onAction("Meus cartões")}><span className="row-icon"><WalletCards size={17} /></span><span>Meus cartões</span><ChevronRight size={16} /></button>

        <button className="promo-card" onClick={() => onAction("Seguro de vida")}>
          <div><span className="promo-label">NOVIDADE</span><strong>Nubank Vida: seguro a partir de<br />R$4/mês.</strong><span className="promo-dots"><i className="active" /><i /><i /></span></div>
          <Sparkles className="promo-spark" size={26} />
        </button>

        <div className="section-rule" />
        <button className="credit-card" onClick={() => onAction("Cartão de crédito")}>
          <div className="section-title"><span>Cartão de crédito</span><ChevronRight size={18} /></div>
          <p>Fatura atual</p><strong>R$ 0,00</strong>
          <p className="credit-limit">Limite disponível de <b>R$ 5.000,00</b></p>
        </button>

        <div className="bottom-nav">
          <button className="bottom-nav-active" onClick={() => onAction("Transferir")} aria-label="Transferir"><ArrowDownUp size={22} /></button>
          <button onClick={() => onAction("Dinheiro")} aria-label="Dinheiro"><DollarSign size={22} /></button>
          <button onClick={() => onAction("Cartões")} aria-label="Cartões"><ShoppingBag size={21} /></button>
          <button onClick={() => onAction("Celular")} aria-label="Celular"><Smartphone size={21} /></button>
        </div>
      </section>
    </div>
  );
}

function PixHeader({ title, subtitle, onBack }: { title: ReactNode; subtitle?: string; onBack: () => void }) {
  return (
    <><StatusBar /><div className="pix-header"><button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><div><span className="eyebrow">Pix e transferir</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="header-header-spacer" /></div></>
  );
}

function PixSearchScreen({ value, setValue, onBack, onContinue, onPickContact }: { value: string; setValue: (value: string) => void; onBack: () => void; onContinue: () => void; onPickContact: (contact: typeof contacts[number]) => void }) {
  return (
    <div className="flow-screen">
      <PixHeader title={<>Para quem você quer<br />transferir?</>} subtitle="" onBack={onBack} />
      <div className="pix-search-body">
        <label className="field-label" htmlFor="pix-key">Insira o dado de quem vai receber</label>
        <div className="search-input-wrap"><input id="pix-key" autoFocus value={value} onChange={(event) => setValue(maskPixInput(event.target.value))} placeholder="Nome, CPF/CNPJ ou chave Pix" inputMode="text" /><QrCode size={20} /></div>
        <div className="search-divider" />
        <p className="muted-copy">Você sempre costuma pagar</p>
        <div className="contacts-row">{contacts.map((contact) => <button className="contact" key={contact.initials} onClick={() => onPickContact(contact)}><span>{contact.initials}</span><b>{contact.name}</b><small>{contact.meta}</small></button>)}</div>
      </div>
      <button className="floating-next" onClick={onContinue} aria-label="Continuar"><ArrowRight size={24} /></button>
    </div>
  );
}

function AmountScreen({ pixInfo, amount, onBack, onDigit, onDelete, onContinue }: { pixInfo: PixInfo; amount: string; onBack: () => void; onDigit: (digit: string) => void; onDelete: () => void; onContinue: () => void }) {
  return (
    <div className="flow-screen amount-screen"><StatusBar /><div className="amount-top"><button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><span>Transferir para</span><strong>{pixInfo.display}</strong><small>{pixInfo.type} · {pixInfo.institution}</small></div><div className="amount-display"><span>Valor</span><strong>{amount}</strong><div className="amount-underline" /></div><div className="pay-card"><span>Pagando com</span><div className="wallet-card"><div className="wallet-icon"><WalletCards size={19} /></div><div><b>Saldo Nubank</b><small>Atual: R$ 500</small></div></div></div><NumberPad onDigit={onDigit} onDelete={onDelete} /><button className="primary-button amount-continue" onClick={onContinue}>Continuar com saldo <ArrowRight size={18} /></button></div>
  );
}

function NumberPad({ onDigit, onDelete }: { onDigit: (digit: string) => void; onDelete: () => void }) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];
  return <div className="number-pad">{digits.map((digit) => <button key={digit} onClick={() => digit === "⌫" ? onDelete() : digit !== "." && onDigit(digit)}>{digit}</button>)}</div>;
}

function ReviewScreen({ pixInfo, amount, onBack, onContinue }: { pixInfo: PixInfo; amount: string; onBack: () => void; onContinue: () => void }) {
  return (
    <div className="flow-screen review-screen"><StatusBar /><div className="review-top"><button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><span>Revisar transferência</span><button className="icon-button" onClick={onBack} aria-label="Fechar"><X size={20} /></button></div><div className="review-main"><div className="review-symbol"><Send size={25} /></div><p className="review-kicker">Você vai enviar</p><h1>{amount}</h1><div className="review-recipient"><span>Para</span><strong>{pixInfo.display}</strong><small>{pixInfo.type} · {pixInfo.institution}</small></div><div className="review-details"><div><span>Quando</span><b>Agora, sem repetir</b></div><div><span>Tipo</span><b>Via Pix</b></div></div></div><button className="primary-button bottom-button" onClick={onContinue}>Enviar <Send size={17} /></button></div>
  );
}

function PinScreen({ pin, onBack, onDigit, onDelete, onContinue }: { pin: string; onBack: () => void; onDigit: (digit: string) => void; onDelete: () => void; onContinue: () => void }) {
  return (
    <div className="flow-screen pin-screen"><StatusBar /><button className="icon-button pin-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><div className="pin-content"><div className="lock-circle"><LockKeyhole size={22} /></div><h1>Digite sua senha de 4 dígitos</h1><p>Essa é a mesma senha de 4 dígitos do seu cartão do Nubank</p><div className="pin-dots">{[0, 1, 2, 3].map((index) => <span className={pin.length > index ? "filled" : ""} key={index} />)}</div></div><div className="pin-pad"><NumberPad onDigit={onDigit} onDelete={onDelete} /></div><button className="primary-button bottom-button" onClick={onContinue}>Continuar</button></div>
  );
}

function ProcessingScreen({ step }: { step: number }) {
  return <div className="processing-screen"><StatusBar /><div className="processing-mark"><div className="processing-ring" /><span>nu</span></div><div className="processing-copy"><strong>{step === 0 ? "Transferindo..." : "Gerando comprovante..."}</strong><div className="progress-line"><span style={{ width: step === 0 ? "38%" : "86%" }} /></div></div><p className="watermark">purpou<span>bank</span></p></div>;
}

function SuccessScreen({ pixInfo, amount, onReceipt, onFinish }: { pixInfo: PixInfo; amount: string; onReceipt: () => void; onFinish: () => void }) {
  return <div className="success-screen"><StatusBar /><button className="close-success" onClick={onFinish} aria-label="Fechar"><X size={20} /></button><div className="success-content"><div className="success-orbit"><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><span className="orbit-dot dot-three" /><span className="success-check"><Check size={27} /></span></div><p className="success-label">Sua transferência foi concluída</p><h1>{amount}</h1><p className="success-to">Para {pixInfo.display}</p><div className="success-details"><div><span>Instituição</span><b>{pixInfo.institution}</b></div><div><span>Chave</span><b>{pixInfo.type}</b></div><div><span>Quando</span><b>Agora</b></div></div></div><button className="primary-button bottom-button" onClick={onReceipt}><ReceiptText size={17} /> Abrir comprovante</button></div>;
}

function EditModal({ field, value, setValue, onClose, onSave }: { field: Exclude<EditField, null>; value: string; setValue: (value: string) => void; onClose: () => void; onSave: () => void }) {
  const isName = field === "name";
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="edit-modal"><div className="modal-handle" /><h2>Digite o novo {isName ? "nome" : "saldo"}:</h2><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} inputMode={isName ? "text" : "decimal"} onKeyDown={(event) => event.key === "Enter" && onSave()} /><div className="modal-actions"><button onClick={onClose}>Cancelar</button><button onClick={onSave}>OK</button></div></div></div>;
}

function ReceiptModal({ pixInfo, amount, onClose }: { pixInfo: PixInfo; amount: string; onClose: () => void }) {
  const transactionId = `PBPX${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  const receiptText = `Comprovante de transferência Pix\nValor enviado: ${amount}\nDestinatário: ${pixInfo.display}\nChave Pix: ${pixInfo.key}\nInstituição: ${pixInfo.institution}\nData e hora: ${dateLabel}\nID da transação: ${transactionId}`;
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="receipt-modal"><button className="receipt-close" onClick={onClose} aria-label="Fechar"><X size={19} /></button><div className="receipt-logo">nu</div><h2 className="receipt-title">Comprovante de transferência Pix</h2><span className="receipt-status"><Check size={14} /> Transferência concluída</span><p className="receipt-amount-label">Valor enviado</p><h3>{amount}</h3><div className="receipt-section-title">Dados da transferência</div><div className="receipt-line"><span>Para</span><b>{pixInfo.display}</b></div><div className="receipt-line"><span>Chave Pix</span><b>{pixInfo.key}</b></div><div className="receipt-line"><span>Tipo de chave</span><b>{pixInfo.type}</b></div><div className="receipt-line"><span>Instituição</span><b>{pixInfo.institution}</b></div><div className="receipt-section-title receipt-section-spaced">Detalhes</div><div className="receipt-line"><span>Data e hora</span><b>{dateLabel}</b></div><div className="receipt-line"><span>ID da transação</span><b>{transactionId}</b></div><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(receiptText)}><Copy size={16} /> Copiar comprovante</button></div></div>;
}

export default App;
