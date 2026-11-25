// Painel do administrador: busca os usuários na API protegida e exporta em PDF.
let usuarios = [];

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function filtrados() {
  const termo = document.getElementById("busca").value.trim().toLowerCase();
  return usuarios.filter((u) => !termo || u.name.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo));
}

function renderizar() {
  const lista = filtrados();
  document.getElementById("tabela-usuarios").innerHTML = lista.length
    ? lista.map((u) => `<tr><td>${u.id}</td><td>${escapar(u.name)}</td><td>${escapar(u.email)}</td><td>${escapar(u.theme)}</td><td>${u.orders}</td><td>${u.isAdmin ? '<span class="new badge orange" data-badge-caption="ADM"></span>' : '<span class="new badge blue" data-badge-caption="Cliente"></span>'}</td></tr>`).join("")
    : `<tr><td colspan="6" class="center-align grey-text">Nenhum usuário encontrado.</td></tr>`;
}

function exportarPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lista = filtrados();
  doc.setFontSize(16);
  doc.text("NÓRD — Usuários cadastrados", 14, 18);
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — Total: ${lista.length}`, 14, 25);
  doc.autoTable({
    startY: 30,
    head: [["ID", "Nome", "E-mail", "Tema", "Pedidos", "Tipo"]],
    body: lista.map((u) => [u.id, u.name, u.email, u.theme, u.orders, u.isAdmin ? "ADM" : "Cliente"]),
    headStyles: { fillColor: [13, 71, 161] },
  });
  doc.save("usuarios-cadastrados.pdf");
  M.toast({ html: "PDF exportado!" });
}

async function carregar() {
  const aviso = document.getElementById("aviso");
  try {
    const resposta = await fetch("/api/admin/usuarios");
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !dados.ok) {
      aviso.innerHTML = `${escapar(dados.message || "Não foi possível carregar os usuários.")} ${resposta.status === 401 ? '<a href="login.html">Fazer login</a>' : ""}`;
      aviso.style.display = "block";
      return;
    }
    usuarios = dados.users;
    document.getElementById("total-usuarios").textContent = usuarios.length;
    document.getElementById("total-admins").textContent = usuarios.filter((u) => u.isAdmin).length;
    document.getElementById("total-pedidos").textContent = usuarios.reduce((s, u) => s + u.orders, 0);
    document.getElementById("painel").style.display = "block";
    renderizar();
  } catch {
    aviso.textContent = "Servidor indisponível. Rode: python main.py";
    aviso.style.display = "block";
  } finally {
    document.getElementById("carregando").style.display = "none";
  }
}

document.getElementById("busca").addEventListener("input", renderizar);
document.getElementById("exportar-pdf").addEventListener("click", exportarPdf);
carregar();
