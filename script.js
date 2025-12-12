/* ============================================
   JAVASCRIPT - SISTEMA DE CHAMADA
   ============================================
   
   ESTRUTURA:
   1. CONFIGURAÇÃO & INICIALIZAÇÃO
   2. VARIÁVEIS GLOBAIS & ELEMENTOS DOM
   3. UTILITÁRIOS
   4. FILTROS & BUSCA
   5. GERENCIAMENTO DE CHAMADAS
   6. HISTÓRICO & VISUALIZAÇÃO
   7. EXPORTAÇÃO (CSV/PDF)
   8. EVENT LISTENERS & INICIALIZAÇÃO
   ============================================ */

/* ============================================
   1. CONFIGURAÇÃO & INICIALIZAÇÃO
   ============================================ */
const SUPABASE_URL = "https://klkqtwqbxpevqsdjkdjj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsa3F0d3FieHBldnFzZGprZGpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNzc4MSwiZXhwIjoyMDgwNzgzNzgxfQ.tm8jrOfE08qQ5fkRp1g7FvfQFw67MaUD809DFJjvKmA";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================
   2. VARIÁVEIS GLOBAIS & ELEMENTOS DOM
   ============================================ */
let modulo = 1; // 1 ou 2

const mod1Btn = document.getElementById("mod1");
const mod2Btn = document.getElementById("mod2");
const estadoSelect = document.getElementById("estadoSelect");
const cidadeSelect = document.getElementById("cidadeSelect");
const turmaSelect = document.getElementById("turmaSelect");
const turmaRdSelect = document.getElementById("turmaRdSelect");
const alunosTbody = document.getElementById("alunos");
const statusEl = document.getElementById("status");
const btnBuscar = document.getElementById("btnBuscar");

/* ============================================
   3. UTILITÁRIOS
   ============================================ */
function setStatus(msg, isError = false, isSuccess = false) {
  statusEl.textContent = msg || "";
  statusEl.className = "status";
  if (isError) {
    statusEl.classList.add("error");
  } else if (isSuccess) {
    statusEl.classList.add("success");
  }
}

// Função para formatar data sem zeros à esquerda
function formatarDataSemZeros(data) {
  if (!data) return '-';
  const d = new Date(data);
  const dia = d.getDate();
  const mes = d.getMonth() + 1;
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Função para formatar data do input (converte d/m/aaaa para formato ISO)
function formatarDataInput(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1; // mês começa em 0
  const ano = parseInt(partes[2]);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  const data = new Date(ano, mes, dia);
  if (data.getDate() !== dia || data.getMonth() !== mes || data.getFullYear() !== ano) return null;
  return data;
}

// Máscara para campo de data
function aplicarMascaraData(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      } else {
        value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4, 8);
      }
    }
    e.target.value = value;
  });
}

/* ============================================
   4. FILTROS & BUSCA
   ============================================ */
// CARREGAR ESTADOS
async function carregarEstados() {
  try {
    const { data, error } = await sb
      .from("cadastro evp")
      .select("ESTADO");

    if (error) {
      console.error(error);
      setStatus("Erro ao buscar estados.", true);
      return;
    }

    // Extrai estados únicos e ordena
    const estados = [...new Set(data.map(d => d.ESTADO).filter(e => e && e.trim() !== ""))].sort();

    estadoSelect.innerHTML = "<option value=''>Selecione o Estado</option>";
    estados.forEach(estado => {
      const opt = document.createElement("option");
      opt.value = estado;
      opt.textContent = estado;
      estadoSelect.appendChild(opt);
    });

    setStatus(`✅ ${estados.length} estados encontrados. Selecione um estado para continuar.`);
  } catch (e) {
    console.error(e);
    setStatus("Erro inesperado ao carregar estados.", true);
  }
}

// CARREGAR CIDADES
async function carregarCidades() {
  const estado = estadoSelect.value;
  cidadeSelect.innerHTML = "<option value=''>Selecione a Cidade</option>";
  cidadeSelect.disabled = !estado;
  turmaSelect.innerHTML = "<option value=''>Selecione o Código da Turma</option>";
  turmaSelect.disabled = true;
  turmaRdSelect.innerHTML = "<option value=''>Selecione o Nome da Turma</option>";
  turmaRdSelect.disabled = true;
  alunosTbody.innerHTML = "";

  if (!estado) {
    setStatus("Selecione um estado primeiro.");
    return;
  }

  try {
    const { data, error } = await sb
      .from("cadastro evp")
      .select("CIDADE")
      .eq("ESTADO", estado);

    if (error) {
      console.error(error);
      setStatus("Erro ao buscar cidades.", true);
      return;
    }

    // Extrai cidades únicas e ordena
    const cidades = [...new Set(data.map(d => d.CIDADE).filter(c => c && c.trim() !== ""))].sort();

    cidadeSelect.innerHTML = "<option value=''>Selecione a Cidade</option>";
    cidades.forEach(cidade => {
      const opt = document.createElement("option");
      opt.value = cidade;
      opt.textContent = cidade;
      cidadeSelect.appendChild(opt);
    });

    cidadeSelect.disabled = false;
    setStatus(`✅ ${cidades.length} cidades encontradas em ${estado}. Selecione uma cidade.`);
  } catch (e) {
    console.error(e);
    setStatus("Erro inesperado ao carregar cidades.", true);
  }
}

// CARREGAR TURMAS (CÓDIGO)
async function carregarTurmas() {
  const estado = estadoSelect.value;
  const cidade = cidadeSelect.value;
  
  turmaSelect.innerHTML = "<option value=''>Selecione o Código da Turma</option>";
  turmaSelect.disabled = !cidade;
  turmaRdSelect.innerHTML = "<option value=''>Selecione o Nome da Turma</option>";
  turmaRdSelect.disabled = true;
  alunosTbody.innerHTML = "";

  if (!cidade) {
    setStatus("Selecione uma cidade primeiro.");
    return;
  }

  try {
    const { data, error } = await sb
      .from("cadastro evp")
      .select("TURMA")
      .eq("ESTADO", estado)
      .eq("CIDADE", cidade);

    if (error) {
      console.error(error);
      setStatus("Erro ao buscar turmas.", true);
      return;
    }

    // Extrai números de turma únicos e ordena
    const turmas = [...new Set(data.map(d => d.TURMA).filter(t => t && t.trim() !== ""))].sort((a, b) => {
      // Ordena numericamente se possível
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    turmaSelect.innerHTML = "<option value=''>Selecione o Código da Turma</option>";
    turmas.forEach(turma => {
      const opt = document.createElement("option");
      opt.value = turma;
      opt.textContent = turma;
      turmaSelect.appendChild(opt);
    });

    turmaSelect.disabled = false;
    setStatus(`✅ ${turmas.length} turmas encontradas em ${cidade}. Selecione o código da turma.`);
  } catch (e) {
    console.error(e);
    setStatus("Erro inesperado ao carregar turmas.", true);
  }
}

// TROCAR MÓDULO
mod1Btn.addEventListener("click", () => trocarModulo(1));
mod2Btn.addEventListener("click", () => trocarModulo(2));

function trocarModulo(m) {
  modulo = m;
  mod1Btn.classList.toggle("active", m === 1);
  mod2Btn.classList.toggle("active", m === 2);
  
  // Recarrega as turmas RD quando mudar o módulo
  if (turmaSelect.value) {
    carregarTurmasRd();
  }
}

// CARREGAR NOMES DAS TURMAS
async function carregarTurmasRd() {
  const estado = estadoSelect.value;
  const cidade = cidadeSelect.value;
  const turma = turmaSelect.value;
  
  turmaRdSelect.innerHTML = "<option value=''>Selecione o Nome da Turma</option>";
  turmaRdSelect.disabled = !turma;
  alunosTbody.innerHTML = "";

  if (!turma) {
    setStatus("Selecione o código da turma primeiro.");
    return;
  }

  const colunaTurmaRd = modulo === 1 ? "TURMA RD módulo 1" : "TURMA RD módulo 2";

  try {
    const { data, error } = await sb
      .from("cadastro evp")
      .select(`id,"${colunaTurmaRd}"`)
      .eq("ESTADO", estado)
      .eq("CIDADE", cidade)
      .eq("TURMA", turma);

    if (error) {
      console.error(error);
      setStatus("Erro ao buscar nomes das turmas.", true);
      return;
    }

    // Filtra apenas as que têm turma RD preenchida
    const turmasRd = data
      .filter(t => t[colunaTurmaRd] && t[colunaTurmaRd].trim() !== "")
      .map(t => ({
        id: t.id,
        nome: t[colunaTurmaRd]
      }));

    turmaRdSelect.innerHTML = "<option value=''>Selecione o Nome da Turma</option>";
    turmasRd.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.nome;
      turmaRdSelect.appendChild(opt);
    });

    turmaRdSelect.disabled = false;
    setStatus(`✅ ${turmasRd.length} turmas encontradas no Módulo ${modulo}. Selecione o nome da turma e clique em "Buscar Alunos".`);
  } catch (e) {
    console.error(e);
    setStatus("Erro inesperado ao carregar nomes das turmas.", true);
  }
}

// Event listeners
estadoSelect.addEventListener("change", carregarCidades);
cidadeSelect.addEventListener("change", carregarTurmas);
turmaSelect.addEventListener("change", carregarTurmasRd);

// LIMPAR FILTROS
const btnLimpar = document.getElementById("btnLimpar");
btnLimpar.addEventListener("click", limparFiltros);

function limparFiltros() {
  // Reset módulo para 1
  modulo = 1;
  mod1Btn.classList.add("active");
  mod2Btn.classList.remove("active");

  // Limpa todos os selects
  estadoSelect.value = "";
  estadoSelect.innerHTML = "<option value=''>Selecione o Estado</option>";
  
  cidadeSelect.value = "";
  cidadeSelect.innerHTML = "<option value=''>Selecione a Cidade</option>";
  cidadeSelect.disabled = true;
  
  turmaSelect.value = "";
  turmaSelect.innerHTML = "<option value=''>Selecione o Código da Turma</option>";
  turmaSelect.disabled = true;
  
  turmaRdSelect.value = "";
  turmaRdSelect.innerHTML = "<option value=''>Selecione o Nome da Turma</option>";
  turmaRdSelect.disabled = true;

  // Limpa a tabela
  alunosTbody.innerHTML = `
    <tr>
      <td colspan="4">
        <div class="empty-state">
          <p>Selecione os filtros acima para buscar os alunos</p>
        </div>
      </td>
    </tr>
  `;

  // Esconde informações da turma
  document.getElementById("turmaInfo").style.display = "none";

  // Recarrega os estados
  setStatus("Filtros limpos. Carregando estados...");
  carregarEstados();
}

// BUSCAR ALUNOS
btnBuscar.addEventListener("click", buscarAlunos);

async function buscarAlunos() {
  const turmaId = turmaRdSelect.value;
  alunosTbody.innerHTML = "";
  document.getElementById("turmaInfo").style.display = "none";

  if (!turmaId) {
    setStatus("Selecione o nome da turma primeiro.", true);
    return;
  }

  try {
    // Converte turmaId para número
    const turmaIdNum = parseInt(turmaId);
    
    if (isNaN(turmaIdNum)) {
      setStatus("Erro: ID da turma inválido.", true);
      return;
    }

    console.log("Buscando alunos para turma_id:", turmaIdNum);

    // Busca informações da turma incluindo o instrutor
    // Tenta buscar todas as colunas possíveis relacionadas a instrutor
    const { data: turmaInfo, error: turmaInfoError } = await sb
      .from("cadastro evp")
      .select("*")
      .eq("id", turmaIdNum)
      .single();

    // Tenta diferentes nomes de coluna para instrutor (case-insensitive)
    let nomeInstrutor = null;
    if (turmaInfo) {
      // Procura por qualquer coluna que contenha "instrutor" no nome
      for (const key in turmaInfo) {
        if (key && typeof key === 'string' && key.toLowerCase().includes('instrutor')) {
          const valor = turmaInfo[key];
          if (valor && typeof valor === 'string' && valor.trim() !== "") {
            nomeInstrutor = valor.trim();
            break;
          }
        }
      }
    }

    // Exibe o instrutor se encontrado
    if (nomeInstrutor) {
      document.getElementById("instrutorNome").textContent = nomeInstrutor;
      document.getElementById("turmaInfo").style.display = "block";
    } else {
      document.getElementById("turmaInfo").style.display = "none";
    }

    const { data, error } = await sb
      .from("vendas RD")
      .select(`id, Nome, Email, "CPF (somente número)"`)
      .eq("turma_id", turmaIdNum);

    console.log("Resultado da busca:", { data, error });

    if (error) {
      console.error("Erro na consulta:", error);
      setStatus(`Erro ao buscar alunos: ${error.message || "Erro desconhecido"}`, true);
      return;
    }

    if (!data || data.length === 0) {
      alunosTbody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <p>Nenhum aluno encontrado para essa turma</p>
            </div>
          </td>
        </tr>
      `;
      setStatus("Nenhum aluno encontrado para essa turma.", false, false);
      return;
    }

    alunosTbody.innerHTML = "";
    
    // Verifica se já existe chamada para esta turma
    await verificarChamadaExistente(turmaId);
    
    // Armazena os alunos para uso na chamada
    window.alunosAtuais = data;
    window.turmaIdAtual = turmaId;
    
    data.forEach((a, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.Nome || "-"}</td>
        <td>${a.Email || "-"}</td>
        <td>${a["CPF (somente número)"] || "-"}</td>
        <td>
          <div class="presenca-buttons">
            <button class="btn-presenca presente active" data-index="${index}" data-presenca="true">
              ✓ Presente
            </button>
            <button class="btn-presenca ausente" data-index="${index}" data-presenca="false">
              ✗ Ausente
            </button>
          </div>
        </td>
      `;
      alunosTbody.appendChild(tr);
    });

    // Adiciona event listeners aos botões de presença
    document.querySelectorAll('.btn-presenca').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        const presente = this.dataset.presenca === 'true';
        
        // Atualiza visualmente
        const row = this.closest('tr');
        const buttons = row.querySelectorAll('.btn-presenca');
        buttons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Atualiza no array de alunos
        if (window.alunosAtuais[index]) {
          window.alunosAtuais[index].presente = presente;
        }
      });
    });

    // Mostra botão de enviar chamada
    document.getElementById('chamadaActions').style.display = 'flex';
    
    setStatus(`✅ ${data.length} aluno(s) encontrado(s) com sucesso! Marque a presença e clique em "Enviar Chamada".`, false, true);
  } catch (e) {
    console.error("Erro completo:", e);
    setStatus(`Erro inesperado ao buscar alunos: ${e.message || "Erro desconhecido"}. Verifique o console para mais detalhes.`, true);
  }
}

/* ============================================
   5. GERENCIAMENTO DE CHAMADAS
   ============================================ */
// VERIFICAR CHAMADA EXISTENTE
async function verificarChamadaExistente(turmaId) {
  try {
    const { data, error } = await sb
      .from("chamadas")
      .select("id, data_chamada, status")
      .eq("turma_id", turmaId)
      .eq("status", "enviada")
      .order("data_chamada", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      document.getElementById('chamadaEnviadaBadge').style.display = 'flex';
      document.getElementById('chamadaActions').style.display = 'none';
      window.chamadaExistenteId = data[0].id;
    } else {
      document.getElementById('chamadaEnviadaBadge').style.display = 'none';
      window.chamadaExistenteId = null;
    }
  } catch (e) {
    console.error(e);
  }
}

// ENVIAR CHAMADA
const btnEnviarChamada = document.getElementById("btnEnviarChamada");
btnEnviarChamada.addEventListener("click", enviarChamada);

async function enviarChamada() {
  if (!window.alunosAtuais || window.alunosAtuais.length === 0) {
    setStatus("Nenhum aluno para enviar chamada.", true);
    return;
  }

  const turmaId = window.turmaIdAtual;
  if (!turmaId) {
    setStatus("Erro: turma não selecionada.", true);
    return;
  }

  // Busca dados da turma
  try {
    const { data: turmaData, error: turmaError } = await sb
      .from("cadastro evp")
      .select("ESTADO, CIDADE, TURMA, \"TURMA RD módulo 1\", \"TURMA RD módulo 2\"")
      .eq("id", turmaId)
      .single();

    if (turmaError || !turmaData) {
      setStatus("Erro ao buscar dados da turma.", true);
      return;
    }

    const nomeTurma = modulo === 1 ? turmaData["TURMA RD módulo 1"] : turmaData["TURMA RD módulo 2"];

    // Cria a chamada
    const { data: chamadaData, error: chamadaError } = await sb
      .from("chamadas")
      .insert({
        turma_id: parseInt(turmaId),
        nome_turma: nomeTurma,
        estado: turmaData.ESTADO,
        cidade: turmaData.CIDADE,
        codigo_turma: turmaData.TURMA,
        modulo: modulo,
        status: "enviada"
      })
      .select()
      .single();

    if (chamadaError) {
      console.error(chamadaError);
      setStatus("Erro ao criar chamada.", true);
      return;
    }

    // Insere os alunos da chamada
    const alunosChamada = window.alunosAtuais.map(a => ({
      chamada_id: chamadaData.id,
      aluno_id: a.id || null,
      nome: a.Nome || "",
      email: a.Email || "",
      cpf: a["CPF (somente número)"] || "",
      presente: a.presente !== false // default true
    }));

    const { error: alunosError } = await sb
      .from("chamada_alunos")
      .insert(alunosChamada);

    if (alunosError) {
      console.error(alunosError);
      setStatus("Erro ao salvar presenças dos alunos.", true);
      return;
    }

    setStatus(`✅ Chamada enviada com sucesso! ${alunosChamada.length} aluno(s) registrado(s).`, false, true);
    document.getElementById('chamadaActions').style.display = 'none';
    document.getElementById('chamadaEnviadaBadge').style.display = 'flex';
    window.chamadaExistenteId = chamadaData.id;

  } catch (e) {
    console.error(e);
    setStatus("Erro inesperado ao enviar chamada.", true);
  }
}

// HISTÓRICO DE CHAMADAS
const btnHistorico = document.getElementById("btnHistorico");
const modalHistorico = document.getElementById("modalHistorico");
const btnFecharModal = document.getElementById("btnFecharModal");

btnHistorico.addEventListener("click", () => {
  modalHistorico.style.display = "flex";
  carregarHistorico();
});

btnFecharModal.addEventListener("click", () => {
  modalHistorico.style.display = "none";
});

modalHistorico.addEventListener("click", (e) => {
  if (e.target === modalHistorico) {
    modalHistorico.style.display = "none";
  }
});

// Função para formatar data do input (converte d/m/aaaa para formato ISO)
function formatarDataInput(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1; // mês começa em 0
  const ano = parseInt(partes[2]);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  const data = new Date(ano, mes, dia);
  if (data.getDate() !== dia || data.getMonth() !== mes || data.getFullYear() !== ano) return null;
  return data;
}

// Máscara para campo de data
function aplicarMascaraData(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      } else {
        value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4, 8);
      }
    }
    e.target.value = value;
  });
}

async function carregarHistorico() {
  const estado = document.getElementById("histEstadoSelect").value;
  const cidade = document.getElementById("histCidadeSelect").value;
  const dataStr = document.getElementById("histDataSelect").value;
  const data = formatarDataInput(dataStr);

  try {
    // Filtra apenas chamadas realizadas (não canceladas)
    let query = sb.from("chamadas")
      .select("*")
      .neq("status", "cancelada")
      .order("data_chamada", { ascending: false });

    if (estado) query = query.eq("estado", estado);
    if (cidade) query = query.eq("cidade", cidade);
    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      query = query.gte("data_chamada", dataInicio.toISOString())
                   .lte("data_chamada", dataFim.toISOString());
    }

    const { data: chamadas, error } = await query;

    if (error) {
      console.error(error);
      return;
    }

    const lista = document.getElementById("historicoLista");
    if (!chamadas || chamadas.length === 0) {
      lista.innerHTML = '<div class="empty-state"><p>Nenhuma chamada encontrada</p></div>';
      return;
    }

    lista.innerHTML = chamadas.map(c => `
      <div class="historico-item-card">
        <div class="historico-card-header">
          <div class="historico-card-title">${c.nome_turma}</div>
          <div class="historico-card-badge modulo-${c.modulo}">Módulo ${c.modulo}</div>
        </div>
        <div class="historico-card-info">
          <div class="historico-card-info-item">
            <span class="info-label">📍</span>
            <span>${c.cidade} - ${c.estado}</span>
          </div>
          <div class="historico-card-info-item">
            <span class="info-label">🔢</span>
            <span>Código: ${c.codigo_turma}</span>
          </div>
          <div class="historico-card-info-item">
            <span class="info-label">📅</span>
            <span>${formatarDataSemZeros(c.data_chamada)}</span>
          </div>
        </div>
        <div class="historico-card-actions">
          <button class="btn-visualizar-chamada" onclick="visualizarChamada(${c.id})">👁️ Visualizar</button>
          <button class="btn-exportar" onclick="exportarChamadaCSV(${c.id})">📊 CSV</button>
          <button class="btn-exportar" onclick="exportarChamadaPDF(${c.id})">📄 PDF</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

document.getElementById("btnBuscarHistorico").addEventListener("click", carregarHistorico);

// Limpar filtros do histórico
document.getElementById("btnLimparFiltrosHistorico").addEventListener("click", function() {
  document.getElementById("histEstadoSelect").value = "";
  document.getElementById("histCidadeSelect").value = "";
  document.getElementById("histCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("histDataSelect").value = "";
  carregarHistorico();
});

// Limpar filtros de cancelamentos
document.getElementById("btnLimparFiltrosCancelamentos").addEventListener("click", function() {
  document.getElementById("cancelEstadoSelect").value = "";
  document.getElementById("cancelCidadeSelect").value = "";
  document.getElementById("cancelCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("cancelModuloSelect").value = "";
  carregarHistoricoCancelamentos();
});

// Aplicar máscara no campo de data quando o modal abrir
btnHistorico.addEventListener("click", function() {
  setTimeout(() => {
    const dataInput = document.getElementById("histDataSelect");
    if (dataInput && !dataInput.hasAttribute('data-mask-applied')) {
      aplicarMascaraData(dataInput);
      dataInput.setAttribute('data-mask-applied', 'true');
    }
  }, 100);
});

// Limpar filtros do histórico
document.getElementById("btnLimparFiltrosHistorico").addEventListener("click", function() {
  document.getElementById("histEstadoSelect").value = "";
  document.getElementById("histCidadeSelect").value = "";
  document.getElementById("histCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("histDataSelect").value = "";
  carregarHistorico();
});

// Limpar filtros de cancelamentos
document.getElementById("btnLimparFiltrosCancelamentos").addEventListener("click", function() {
  document.getElementById("cancelEstadoSelect").value = "";
  document.getElementById("cancelCidadeSelect").value = "";
  document.getElementById("cancelCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("cancelModuloSelect").value = "";
  carregarHistoricoCancelamentos();
});

// Aplicar máscara no campo de data quando o modal abrir
btnHistorico.addEventListener("click", function() {
  setTimeout(() => {
    const dataInput = document.getElementById("histDataSelect");
    if (dataInput && !dataInput.hasAttribute('data-mask-applied')) {
      aplicarMascaraData(dataInput);
      dataInput.setAttribute('data-mask-applied', 'true');
    }
  }, 100);
});

// Limpar filtros do histórico
document.getElementById("btnLimparFiltrosHistorico").addEventListener("click", function() {
  document.getElementById("histEstadoSelect").value = "";
  document.getElementById("histCidadeSelect").value = "";
  document.getElementById("histCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("histDataSelect").value = "";
  carregarHistorico();
});

// Limpar filtros de cancelamentos
document.getElementById("btnLimparFiltrosCancelamentos").addEventListener("click", function() {
  document.getElementById("cancelEstadoSelect").value = "";
  document.getElementById("cancelCidadeSelect").value = "";
  document.getElementById("cancelCidadeSelect").innerHTML = "<option value=''>Todas as Cidades</option>";
  document.getElementById("cancelModuloSelect").value = "";
  carregarHistoricoCancelamentos();
});

// Aplicar máscara no campo de data
document.addEventListener("DOMContentLoaded", function() {
  const dataInput = document.getElementById("histDataSelect");
  if (dataInput) {
    aplicarMascaraData(dataInput);
  }
});

// VISUALIZAR CHAMADA
const btnVisualizarChamada = document.getElementById("btnVisualizarChamada");
const modalVisualizarChamada = document.getElementById("modalVisualizarChamada");
const btnFecharModalChamada = document.getElementById("btnFecharModalChamada");

btnVisualizarChamada.addEventListener("click", () => {
  if (window.chamadaExistenteId) {
    visualizarChamada(window.chamadaExistenteId);
  }
});

btnFecharModalChamada.addEventListener("click", () => {
  modalVisualizarChamada.style.display = "none";
});

modalVisualizarChamada.addEventListener("click", (e) => {
  if (e.target === modalVisualizarChamada) {
    modalVisualizarChamada.style.display = "none";
  }
});

async function visualizarChamada(chamadaId) {
  try {
    const { data: chamada, error: chamadaError } = await sb
      .from("chamadas")
      .select("*")
      .eq("id", chamadaId)
      .single();

    if (chamadaError || !chamada) {
      setStatus("Erro ao carregar chamada.", true);
      return;
    }

    const { data: alunos, error: alunosError } = await sb
      .from("chamada_alunos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .order("nome");

    if (alunosError) {
      console.error(alunosError);
      return;
    }

    const presentes = alunos.filter(a => a.presente === true || a.presente === 'true').length;
    const ausentes = alunos.filter(a => a.presente === false || a.presente === 'false').length;
    
    // Verifica se a chamada está cancelada
    const chamadaCancelada = chamada.status === 'cancelada';

    const body = document.getElementById("modalChamadaBody");
    
    // Esconde botões de edição se estiver cancelada
    if (chamadaCancelada) {
      btnEditarChamada.style.display = 'none';
      btnCancelarChamada.style.display = 'none';
    } else {
      btnEditarChamada.style.display = 'inline-flex';
      btnCancelarChamada.style.display = 'inline-flex';
    }
    
    body.innerHTML = `
      ${chamadaCancelada ? `
        <div class="chamada-cancelada-badge">
          <span>🚫</span>
          <span>Esta chamada foi cancelada</span>
        </div>
      ` : ''}
      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f766e; margin-bottom: 16px;">Informações da Turma</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div><strong>Nome da Turma:</strong> ${chamada.nome_turma}</div>
          <div><strong>Estado:</strong> ${chamada.estado}</div>
          <div><strong>Cidade:</strong> ${chamada.cidade}</div>
          <div><strong>Código:</strong> ${chamada.codigo_turma}</div>
          <div><strong>Módulo:</strong> ${chamada.modulo}</div>
          <div><strong>Data:</strong> ${formatarDataSemZeros(chamada.data_chamada)}</div>
        </div>
        <div style="display: flex; gap: 16px; margin-top: 16px;">
          <div style="padding: 12px; background: #ecfdf5; border-radius: 8px;">
            <strong style="color: #059669;">Presentes:</strong> ${presentes}
          </div>
          <div style="padding: 12px; background: #fef2f2; border-radius: 8px;">
            <strong style="color: #dc2626;">Ausentes:</strong> ${ausentes}
          </div>
          <div style="padding: 12px; background: #f3f4f6; border-radius: 8px;">
            <strong>Total:</strong> ${alunos.length}
          </div>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>CPF</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${alunos.map(a => {
              const presente = a.presente === true || a.presente === 'true';
              return `
              <tr>
                <td>${a.nome || "-"}</td>
                <td>${a.email || "-"}</td>
                <td>${a.cpf || "-"}</td>
                <td>
                  <span style="padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; 
                    ${presente ? 'background: #ecfdf5; color: #059669;' : 'background: #fef2f2; color: #dc2626;'}">
                    ${presente ? '✓ Presente' : '✗ Ausente'}
                  </span>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    window.chamadaAtualParaExportar = { chamada, alunos };
    window.chamadaAtualVisualizando = chamadaId;
    modalVisualizarChamada.style.display = "flex";
  } catch (e) {
    console.error(e);
    setStatus("Erro ao visualizar chamada.", true);
  }
}

// CANCELAR CHAMADA
const btnCancelarChamada = document.getElementById("btnCancelarChamada");
const modalCancelarChamada = document.getElementById("modalCancelarChamada");
const btnFecharModalCancelar = document.getElementById("btnFecharModalCancelar");
const btnCancelarCancelamento = document.getElementById("btnCancelarCancelamento");
const btnConfirmarCancelamento = document.getElementById("btnConfirmarCancelamento");

btnCancelarChamada.addEventListener("click", () => {
  if (window.chamadaAtualVisualizando) {
    modalCancelarChamada.style.display = "flex";
    document.getElementById("motivoCancelamento").value = "";
  }
});

btnFecharModalCancelar.addEventListener("click", () => {
  modalCancelarChamada.style.display = "none";
});

btnCancelarCancelamento.addEventListener("click", () => {
  modalCancelarChamada.style.display = "none";
});

modalCancelarChamada.addEventListener("click", (e) => {
  if (e.target === modalCancelarChamada) {
    modalCancelarChamada.style.display = "none";
  }
});

btnConfirmarCancelamento.addEventListener("click", async function() {
  const motivo = document.getElementById("motivoCancelamento").value.trim();
  
  if (!motivo) {
    setStatus("Por favor, informe o motivo do cancelamento.", true);
    document.getElementById("motivoCancelamento").focus();
    return;
  }

  if (!window.chamadaAtualVisualizando) {
    setStatus("Erro: chamada não identificada.", true);
    return;
  }

  btnConfirmarCancelamento.disabled = true;
  btnConfirmarCancelamento.textContent = "🚫 Cancelando...";

  try {
    const chamadaId = window.chamadaAtualVisualizando;

    // Busca dados completos da chamada
    const { data: chamada } = await sb
      .from("chamadas")
      .select("*")
      .eq("id", chamadaId)
      .single();

    const { data: alunos } = await sb
      .from("chamada_alunos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .order("nome");

    // Salva no histórico de cancelamentos
    const { error: cancelamentoError } = await sb
      .from("chamada_cancelamentos")
      .insert({
        chamada_id: chamadaId,
        motivo_cancelamento: motivo,
        dados_chamada: {
          chamada: chamada,
          alunos: alunos
        }
      });

    if (cancelamentoError) {
      console.error("Erro ao salvar cancelamento:", cancelamentoError);
      setStatus("Erro ao registrar cancelamento.", true);
      return;
    }

    // Atualiza status da chamada para cancelada
    const { error: updateError } = await sb
      .from("chamadas")
      .update({ status: "cancelada" })
      .eq("id", chamadaId);

    if (updateError) {
      console.error("Erro ao atualizar status:", updateError);
    }

    setStatus("✅ Chamada cancelada com sucesso! Carregando histórico de cancelamentos...", false, true);
    modalCancelarChamada.style.display = "none";
    modalVisualizarChamada.style.display = "none";
    
    // Mostra histórico de cancelamentos
    await mostrarHistoricoCancelamentos();

  } catch (e) {
    console.error(e);
    setStatus("Erro ao cancelar chamada.", true);
  } finally {
    btnConfirmarCancelamento.disabled = false;
    btnConfirmarCancelamento.textContent = "🚫 Confirmar Cancelamento";
  }
});

// EDITAR CHAMADA
const btnEditarChamada = document.getElementById("btnEditarChamada");
const modalEditarChamada = document.getElementById("modalEditarChamada");
const btnFecharModalEditar = document.getElementById("btnFecharModalEditar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const btnSalvarEdicao = document.getElementById("btnSalvarEdicao");

btnEditarChamada.addEventListener("click", async () => {
  if (window.chamadaAtualVisualizando) {
    // Verifica se a chamada está cancelada
    const { data: chamada } = await sb
      .from("chamadas")
      .select("status")
      .eq("id", window.chamadaAtualVisualizando)
      .single();
    
    if (chamada && chamada.status === 'cancelada') {
      setStatus("❌ Não é possível editar uma chamada cancelada.", true);
      return;
    }
    
    abrirModalEdicao(window.chamadaAtualVisualizando);
  }
});

btnFecharModalEditar.addEventListener("click", () => {
  modalEditarChamada.style.display = "none";
});

btnCancelarEdicao.addEventListener("click", () => {
  modalEditarChamada.style.display = "none";
});

modalEditarChamada.addEventListener("click", (e) => {
  if (e.target === modalEditarChamada) {
    modalEditarChamada.style.display = "none";
  }
});

async function abrirModalEdicao(chamadaId) {
  try {
    const { data: chamada, error: chamadaError } = await sb
      .from("chamadas")
      .select("*")
      .eq("id", chamadaId)
      .single();

    if (chamadaError || !chamada) {
      setStatus("Erro ao carregar chamada para edição.", true);
      return;
    }

    const { data: alunos, error: alunosError } = await sb
      .from("chamada_alunos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .order("nome");

    if (alunosError) {
      console.error(alunosError);
      setStatus("Erro ao carregar alunos para edição.", true);
      return;
    }

    // Armazena dados originais para histórico
    window.dadosAntesEdicao = {
      chamada: chamada,
      alunos: alunos
    };

    // Limpa o campo de motivo
    document.getElementById("motivoEdicao").value = "";

    // Renderiza alunos editáveis
    const container = document.getElementById("alunosEdicaoContainer");
    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="color: #0f766e; margin-bottom: 12px;">Editar Presença dos Alunos</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Presença</th>
              </tr>
            </thead>
            <tbody>
              ${alunos.map((a, index) => `
                <tr>
                  <td>${a.nome || "-"}</td>
                  <td>${a.email || "-"}</td>
                  <td>${a.cpf || "-"}</td>
                  <td>
                    <div class="presenca-buttons">
                      <button class="btn-presenca presente ${a.presente ? 'active' : ''}" data-aluno-id="${a.id}" data-presenca="true">
                        ✓ Presente
                      </button>
                      <button class="btn-presenca ausente ${!a.presente ? 'active' : ''}" data-aluno-id="${a.id}" data-presenca="false">
                        ✗ Ausente
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Adiciona event listeners aos botões de presença
    container.querySelectorAll('.btn-presenca').forEach(btn => {
      btn.addEventListener('click', function() {
        const alunoId = this.dataset.alunoId;
        const presente = this.dataset.presenca === 'true';
        
        // Atualiza visualmente
        const row = this.closest('tr');
        const buttons = row.querySelectorAll('.btn-presenca');
        buttons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Atualiza no array de alunos
        const alunoIndex = alunos.findIndex(a => a.id == alunoId);
        if (alunoIndex !== -1) {
          alunos[alunoIndex].presente = presente;
        }
      });
    });

    window.alunosEditando = alunos;
    window.chamadaEditando = chamada;
    modalEditarChamada.style.display = "flex";
    modalVisualizarChamada.style.display = "none";

  } catch (e) {
    console.error(e);
    setStatus("Erro ao abrir edição.", true);
  }
}

btnSalvarEdicao.addEventListener("click", async function() {
  const motivo = document.getElementById("motivoEdicao").value.trim();
  
  if (!motivo) {
    setStatus("Por favor, informe o motivo da edição.", true);
    document.getElementById("motivoEdicao").focus();
    return;
  }

  if (!window.alunosEditando || !window.chamadaEditando) {
    setStatus("Erro: dados não carregados.", true);
    return;
  }

  btnSalvarEdicao.disabled = true;
  btnSalvarEdicao.textContent = "💾 Salvando...";

  try {
    const chamadaId = window.chamadaEditando.id;
    const dadosAntes = window.dadosAntesEdicao;

    // Atualiza presença dos alunos
    for (const aluno of window.alunosEditando) {
      const { error } = await sb
        .from("chamada_alunos")
        .update({ presente: aluno.presente })
        .eq("id", aluno.id);

      if (error) {
        console.error("Erro ao atualizar aluno:", error);
      }
    }

    // Busca dados atualizados para histórico
    const { data: chamadaAtualizada } = await sb
      .from("chamadas")
      .select("*")
      .eq("id", chamadaId)
      .single();

    const { data: alunosAtualizados } = await sb
      .from("chamada_alunos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .order("nome");

    // Salva no histórico de edições
    const { error: historicoError } = await sb
      .from("chamada_historico_edicoes")
      .insert({
        chamada_id: chamadaId,
        motivo_edicao: motivo,
        dados_anteriores: dadosAntes,
        dados_novos: {
          chamada: chamadaAtualizada,
          alunos: alunosAtualizados
        }
      });

    if (historicoError) {
      console.error("Erro ao salvar histórico:", historicoError);
    }

    setStatus("✅ Chamada editada com sucesso! Carregando histórico...", false, true);
    modalEditarChamada.style.display = "none";
    
    // Mostra histórico de edições
    await mostrarHistoricoEdicoes(chamadaId);

  } catch (e) {
    console.error(e);
    setStatus("Erro ao salvar edição.", true);
  } finally {
    btnSalvarEdicao.disabled = false;
    btnSalvarEdicao.textContent = "💾 Salvar Edição";
  }
});

// HISTÓRICO DE EDIÇÕES
const modalHistoricoEdicoes = document.getElementById("modalHistoricoEdicoes");
const btnFecharModalHistoricoEdicoes = document.getElementById("btnFecharModalHistoricoEdicoes");

btnFecharModalHistoricoEdicoes.addEventListener("click", () => {
  modalHistoricoEdicoes.style.display = "none";
});

modalHistoricoEdicoes.addEventListener("click", (e) => {
  if (e.target === modalHistoricoEdicoes) {
    modalHistoricoEdicoes.style.display = "none";
  }
});

async function mostrarHistoricoEdicoes(chamadaId) {
  try {
    const { data: historico, error } = await sb
      .from("chamada_historico_edicoes")
      .select("*")
      .eq("chamada_id", chamadaId)
      .order("data_edicao", { ascending: false });

    if (error) {
      console.error(error);
      setStatus("Erro ao carregar histórico de edições.", true);
      return;
    }

    const body = document.getElementById("modalHistoricoEdicoesBody");
    
    if (!historico || historico.length === 0) {
      body.innerHTML = '<div class="empty-state"><p>Nenhuma edição registrada para esta chamada</p></div>';
    } else {
      body.innerHTML = historico.map((edicao, index) => {
        const dadosAntes = edicao.dados_anteriores;
        const dadosDepois = edicao.dados_novos;
        const alunosAntes = dadosAntes.alunos || [];
        const alunosDepois = dadosDepois.alunos || [];

        // Calcula estatísticas
        const presentesAntes = alunosAntes.filter(a => a.presente === true || a.presente === 'true').length;
        const ausentesAntes = alunosAntes.filter(a => a.presente === false || a.presente === 'false').length;
        const presentesDepois = alunosDepois.filter(a => a.presente === true || a.presente === 'true').length;
        const ausentesDepois = alunosDepois.filter(a => a.presente === false || a.presente === 'false').length;

        // Identifica mudanças
        const mudancas = [];
        alunosAntes.forEach((alunoAntes, idx) => {
          const alunoDepois = alunosDepois.find(a => a.id === alunoAntes.id || a.nome === alunoAntes.nome);
          if (alunoDepois) {
            const antesPresente = alunoAntes.presente === true || alunoAntes.presente === 'true';
            const depoisPresente = alunoDepois.presente === true || alunoDepois.presente === 'true';
            if (antesPresente !== depoisPresente) {
              mudancas.push({
                nome: alunoAntes.nome,
                antes: antesPresente ? 'Presente' : 'Ausente',
                depois: depoisPresente ? 'Presente' : 'Ausente'
              });
            }
          }
        });

        return `
          <div class="historico-edicao-item">
            <div class="historico-edicao-header">
              <div>
                <strong style="color: #0f766e; font-size: 16px;">Edição #${historico.length - index}</strong>
              </div>
              <div class="historico-edicao-data">
                ${formatarDataSemZeros(edicao.data_edicao)}
              </div>
            </div>
            <div class="historico-edicao-motivo">
              <strong>Motivo da Edição:</strong>
              ${edicao.motivo_edicao}
            </div>
            <div class="comparacao-container">
              <div class="comparacao-coluna antes">
                <div class="comparacao-header">📋 ANTES DA EDIÇÃO</div>
                <div style="margin-bottom: 12px;">
                  <div><strong>Presentes:</strong> ${presentesAntes}</div>
                  <div><strong>Ausentes:</strong> ${ausentesAntes}</div>
                  <div><strong>Total:</strong> ${alunosAntes.length}</div>
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                  ${alunosAntes.map(a => {
                    const presente = a.presente === true || a.presente === 'true';
                    return `
                    <div style="padding: 4px 0; border-bottom: 1px solid #fee2e2;">
                      <div style="font-weight: 500;">${a.nome || '-'}</div>
                      <div style="font-size: 12px; color: ${presente ? '#059669' : '#dc2626'}; font-weight: 600;">
                        ${presente ? '✓ Presente' : '✗ Ausente'}
                      </div>
                    </div>
                  `;
                  }).join('')}
                </div>
              </div>
              <div class="comparacao-coluna depois">
                <div class="comparacao-header">✅ DEPOIS DA EDIÇÃO</div>
                <div style="margin-bottom: 12px;">
                  <div><strong>Presentes:</strong> ${presentesDepois}</div>
                  <div><strong>Ausentes:</strong> ${ausentesDepois}</div>
                  <div><strong>Total:</strong> ${alunosDepois.length}</div>
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                  ${alunosDepois.map(a => {
                    const presente = a.presente === true || a.presente === 'true';
                    return `
                    <div style="padding: 4px 0; border-bottom: 1px solid #a7f3d0;">
                      <div style="font-weight: 500;">${a.nome || '-'}</div>
                      <div style="font-size: 12px; color: ${presente ? '#059669' : '#dc2626'}; font-weight: 600;">
                        ${presente ? '✓ Presente' : '✗ Ausente'}
                      </div>
                    </div>
                  `;
                  }).join('')}
                </div>
              </div>
            </div>
            ${mudancas.length > 0 ? `
              <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <strong style="color: #92400e;">Mudanças Realizadas:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                  ${mudancas.map(m => `<li style="color: #78350f;">${m.nome}: <strong>${m.antes}</strong> → <strong>${m.depois}</strong></li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    modalHistoricoEdicoes.style.display = "flex";
  } catch (e) {
    console.error(e);
    setStatus("Erro ao carregar histórico de edições.", true);
  }
}

/* ============================================
   7. EXPORTAÇÃO (CSV/PDF)
   ============================================ */
document.getElementById("btnExportarCSV").addEventListener("click", () => {
  if (window.chamadaAtualParaExportar) {
    exportarChamadaCSV(window.chamadaAtualParaExportar.chamada.id);
  }
});

document.getElementById("btnExportarPDF").addEventListener("click", () => {
  if (window.chamadaAtualParaExportar) {
    exportarChamadaPDF(window.chamadaAtualParaExportar.chamada.id);
  }
});

document.getElementById("btnVerHistoricoEdicoes").addEventListener("click", () => {
  if (window.chamadaAtualVisualizando) {
    mostrarHistoricoEdicoes(window.chamadaAtualVisualizando);
  }
});

async function exportarChamadaCSV(chamadaId) {
  try {
    const { data: chamada } = await sb.from("chamadas").select("*").eq("id", chamadaId).single();
    const { data: alunos } = await sb.from("chamada_alunos").select("*").eq("chamada_id", chamadaId).order("nome");

    let csv = "Nome,Email,CPF,Status\n";
    alunos.forEach(a => {
      const presente = a.presente === true || a.presente === 'true';
      csv += `"${a.nome || ''}","${a.email || ''}","${a.cpf || ''}","${presente ? 'Presente' : 'Ausente'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `chamada_${chamada.nome_turma}_${new Date(chamada.data_chamada).toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error(e);
    setStatus("Erro ao exportar CSV.", true);
  }
}

async function exportarChamadaPDF(chamadaId) {
  setStatus("Abrindo visualização para impressão...", false);
  
  const { chamada, alunos } = window.chamadaAtualParaExportar || {};
  if (!chamada || !alunos) {
    try {
      const { data: c } = await sb.from("chamadas").select("*").eq("id", chamadaId).single();
      const { data: a } = await sb.from("chamada_alunos").select("*").eq("chamada_id", chamadaId).order("nome");
      window.chamadaAtualParaExportar = { chamada: c, alunos: a };
    } catch (e) {
      setStatus("Erro ao carregar dados para PDF.", true);
      return;
    }
  }
  
  const { chamada: c, alunos: a } = window.chamadaAtualParaExportar;
  const presentes = a.filter(function(al) { return al.presente === true || al.presente === 'true'; }).length;
  const ausentes = a.filter(function(al) { return al.presente === false || al.presente === 'false'; }).length;
  
  let htmlContent = '<!DOCTYPE html><html><head><title>Chamada - ' + c.nome_turma + '</title>';
  htmlContent += '<style>@media print { body { margin: 0; } }';
  htmlContent += 'body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #1f2937; }';
  htmlContent += '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0f766e; padding-bottom: 20px; }';
  htmlContent += 'h1 { color: #0f766e; margin: 10px 0; font-size: 28px; }';
  htmlContent += 'h2 { color: #14b8a6; margin: 5px 0; font-size: 18px; font-weight: 400; }';
  htmlContent += '.info { margin: 20px 0; background: #f9fafb; padding: 20px; border-radius: 8px; }';
  htmlContent += '.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }';
  htmlContent += '.stats { display: flex; gap: 16px; margin-top: 16px; }';
  htmlContent += '.stat-box { padding: 12px 20px; border-radius: 8px; text-align: center; }';
  htmlContent += '.stat-presente { background: #ecfdf5; color: #059669; }';
  htmlContent += '.stat-ausente { background: #fef2f2; color: #dc2626; }';
  htmlContent += '.stat-total { background: #f3f4f6; color: #374151; }';
  htmlContent += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
  htmlContent += 'th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }';
  htmlContent += 'th { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; font-weight: 600; }';
  htmlContent += '.presente { color: #059669; font-weight: 600; }';
  htmlContent += '.ausente { color: #dc2626; font-weight: 600; }';
  htmlContent += '.footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }</style></head><body>';
  htmlContent += '<div class="header"><h1>VOLL PILATES GROUP</h1><h2>Sistema de Chamada</h2></div>';
  htmlContent += '<div class="info"><h3 style="color: #0f766e; margin-bottom: 12px;">Informações da Turma</h3>';
  htmlContent += '<div class="info-grid">';
  htmlContent += '<div><strong>Nome da Turma:</strong> ' + (c.nome_turma || '') + '</div>';
  htmlContent += '<div><strong>Estado:</strong> ' + (c.estado || '') + '</div>';
  htmlContent += '<div><strong>Cidade:</strong> ' + (c.cidade || '') + '</div>';
  htmlContent += '<div><strong>Código:</strong> ' + (c.codigo_turma || '') + '</div>';
  htmlContent += '<div><strong>Módulo:</strong> ' + (c.modulo || '') + '</div>';
  htmlContent += '<div><strong>Data:</strong> ' + formatarDataSemZeros(c.data_chamada) + '</div>';
  htmlContent += '</div><div class="stats">';
  htmlContent += '<div class="stat-box stat-presente"><div style="font-size: 24px; font-weight: bold;">' + presentes + '</div><div>Presentes</div></div>';
  htmlContent += '<div class="stat-box stat-ausente"><div style="font-size: 24px; font-weight: bold;">' + ausentes + '</div><div>Ausentes</div></div>';
  htmlContent += '<div class="stat-box stat-total"><div style="font-size: 24px; font-weight: bold;">' + a.length + '</div><div>Total</div></div>';
  htmlContent += '</div></div><table><thead><tr><th>Nome</th><th>Email</th><th>CPF</th><th>Status</th></tr></thead><tbody>';
  
  a.forEach(function(al) {
    const presente = al.presente === true || al.presente === 'true';
    const statusClass = presente ? 'presente' : 'ausente';
    const statusText = presente ? '✓ Presente' : '✗ Ausente';
    htmlContent += '<tr><td>' + (al.nome || '-') + '</td><td>' + (al.email || '-') + '</td><td>' + (al.cpf || '-') + '</td><td class="' + statusClass + '">' + statusText + '</td></tr>';
  });
  
  htmlContent += '</tbody></table>';
  htmlContent += '<div class="footer"><p>Documento gerado em ' + new Date().toLocaleString('pt-BR') + ' - VOLL PILATES GROUP</p></div>';
  htmlContent += '</body></html>';
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(function() {
    printWindow.print();
  }, 500);
}

// HISTÓRICO DE CANCELAMENTOS
const modalHistoricoCancelamentos = document.getElementById("modalHistoricoCancelamentos");
const btnFecharModalHistoricoCancelamentos = document.getElementById("btnFecharModalHistoricoCancelamentos");

btnFecharModalHistoricoCancelamentos.addEventListener("click", () => {
  modalHistoricoCancelamentos.style.display = "none";
});

modalHistoricoCancelamentos.addEventListener("click", (e) => {
  if (e.target === modalHistoricoCancelamentos) {
    modalHistoricoCancelamentos.style.display = "none";
  }
});

async function carregarHistoricoCancelamentos() {
  const estado = document.getElementById("cancelEstadoSelect").value;
  const cidade = document.getElementById("cancelCidadeSelect").value;
  const modulo = document.getElementById("cancelModuloSelect").value;

  try {
    let query = sb
      .from("chamada_cancelamentos")
      .select("*")
      .order("data_cancelamento", { ascending: false });

    const { data: cancelamentos, error } = await query;

    if (error) {
      console.error(error);
      setStatus("Erro ao carregar histórico de cancelamentos.", true);
      return;
    }

    // Filtra os cancelamentos baseado nos filtros
    let cancelamentosFiltrados = cancelamentos || [];
    
    if (estado) {
      cancelamentosFiltrados = cancelamentosFiltrados.filter(c => {
        const chamada = c.dados_chamada?.chamada || {};
        return chamada.estado === estado;
      });
    }
    
    if (cidade) {
      cancelamentosFiltrados = cancelamentosFiltrados.filter(c => {
        const chamada = c.dados_chamada?.chamada || {};
        return chamada.cidade === cidade;
      });
    }
    
    if (modulo) {
      cancelamentosFiltrados = cancelamentosFiltrados.filter(c => {
        const chamada = c.dados_chamada?.chamada || {};
        return chamada.modulo == modulo;
      });
    }

    const lista = document.getElementById("historicoCancelamentosLista");
    
    if (!cancelamentosFiltrados || cancelamentosFiltrados.length === 0) {
      lista.innerHTML = '<div class="empty-state"><p>Nenhuma chamada cancelada encontrada</p></div>';
      return;
    }

    lista.innerHTML = cancelamentosFiltrados.map((cancelamento) => {
      const dados = cancelamento.dados_chamada;
      const chamada = dados.chamada || {};
      const alunos = dados.alunos || [];
      const presentes = alunos.filter(a => a.presente === true || a.presente === 'true').length;
      const ausentes = alunos.filter(a => a.presente === false || a.presente === 'false').length;

      return `
        <div class="historico-item-card historico-cancelado-card">
          <div class="historico-card-header">
            <div class="historico-card-title">${chamada.nome_turma || 'Turma não identificada'}</div>
            <div class="historico-cancelado-badge">🚫 Cancelada</div>
          </div>
          <div class="historico-card-info">
            <div class="historico-card-info-item">
              <span class="info-label">📍</span>
              <span>${chamada.cidade || '-'} - ${chamada.estado || '-'}</span>
            </div>
            <div class="historico-card-info-item">
              <span class="info-label">🔢</span>
              <span>Código: ${chamada.codigo_turma || '-'}</span>
            </div>
            <div class="historico-card-info-item">
              <span class="info-label">📅</span>
              <span>${formatarDataSemZeros(chamada.data_chamada)}</span>
            </div>
            <div class="historico-card-info-item">
              <span class="info-label">📊</span>
              <span>${presentes} presentes, ${ausentes} ausentes</span>
            </div>
          </div>
          <div style="margin-top: 12px; padding: 10px; background: #fee2e2; border-radius: 8px; border-left: 3px solid #dc2626;">
            <div style="font-size: 12px; color: #991b1b; font-weight: 600; margin-bottom: 4px;">Motivo:</div>
            <div style="font-size: 13px; color: #7f1d1d;">${cancelamento.motivo_cancelamento || '-'}</div>
          </div>
          <div class="historico-card-actions" style="margin-top: 12px;">
            <button class="btn-visualizar-chamada" onclick="visualizarChamadaCancelada(${cancelamento.chamada_id})">👁️ Visualizar</button>
            <button class="btn-exportar" onclick="exportarChamadaCanceladaCSV(${cancelamento.chamada_id})">📊 CSV</button>
            <button class="btn-exportar" onclick="exportarChamadaCanceladaPDF(${cancelamento.chamada_id})">📄 PDF</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (e) {
    console.error(e);
    setStatus("Erro ao carregar histórico de cancelamentos.", true);
  }
}

async function mostrarHistoricoCancelamentos() {
  // Carrega estados e cidades para os filtros
  await carregarEstadosCancelamentos();
  
  modalHistoricoCancelamentos.style.display = "flex";
  await carregarHistoricoCancelamentos();
}

let listenerCancelamentoAdicionado = false;

async function carregarEstadosCancelamentos() {
  try {
    const select = document.getElementById("cancelEstadoSelect");
    
    // Limpa o select mantendo apenas a opção padrão
    select.innerHTML = "<option value=''>Todos os Estados</option>";

    const { data: cancelamentos } = await sb
      .from("chamada_cancelamentos")
      .select("*");

    const estados = new Set();
    cancelamentos.forEach(c => {
      const estado = c.dados_chamada?.chamada?.estado;
      if (estado) estados.add(estado);
    });

    const estadosArray = Array.from(estados).sort();
    
    estadosArray.forEach(estado => {
      const opt = document.createElement("option");
      opt.value = estado;
      opt.textContent = estado;
      select.appendChild(opt);
    });

    // Event listener para carregar cidades quando estado mudar (apenas uma vez)
    if (!listenerCancelamentoAdicionado) {
      select.addEventListener("change", async () => {
        await carregarCidadesCancelamentos();
      });
      listenerCancelamentoAdicionado = true;
    }

  } catch (e) {
    console.error(e);
  }
}

async function carregarCidadesCancelamentos() {
  const estado = document.getElementById("cancelEstadoSelect").value;
  const select = document.getElementById("cancelCidadeSelect");
  
  // Limpa o select mantendo apenas a opção padrão
  select.innerHTML = "<option value=''>Todas as Cidades</option>";

  if (!estado) return;

  try {
    const { data: cancelamentos } = await sb
      .from("chamada_cancelamentos")
      .select("*");

    const cidades = new Set();
    cancelamentos.forEach(c => {
      const chamada = c.dados_chamada?.chamada || {};
      if (chamada.estado === estado && chamada.cidade) {
        cidades.add(chamada.cidade);
      }
    });

    const cidadesArray = Array.from(cidades).sort();
    cidadesArray.forEach(cidade => {
      const opt = document.createElement("option");
      opt.value = cidade;
      opt.textContent = cidade;
      select.appendChild(opt);
    });

  } catch (e) {
    console.error(e);
  }
}

// Botão de histórico de cancelamentos no histórico geral
const btnVerHistoricoCancelamentosGlobal = document.getElementById("btnVerHistoricoCancelamentosGlobal");
if (btnVerHistoricoCancelamentosGlobal) {
  btnVerHistoricoCancelamentosGlobal.addEventListener("click", mostrarHistoricoCancelamentos);
}

// Botão buscar cancelamentos
document.getElementById("btnBuscarCancelamentos").addEventListener("click", carregarHistoricoCancelamentos);

// Funções para visualizar e exportar chamadas canceladas
async function visualizarChamadaCancelada(chamadaId) {
  try {
    // Busca os dados da chamada cancelada
    const { data: cancelamento } = await sb
      .from("chamada_cancelamentos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .single();

    if (!cancelamento) {
      setStatus("Chamada cancelada não encontrada.", true);
      return;
    }

    const dados = cancelamento.dados_chamada;
    const chamada = dados.chamada || {};
    const alunos = dados.alunos || [];

    // Prepara dados para visualização
    window.chamadaAtualParaExportar = { chamada, alunos };
    window.chamadaAtualVisualizando = chamadaId;

    // Abre modal de visualização
    await visualizarChamada(chamadaId);
  } catch (e) {
    console.error(e);
    setStatus("Erro ao visualizar chamada cancelada.", true);
  }
}

async function exportarChamadaCanceladaCSV(chamadaId) {
  try {
    const { data: cancelamento } = await sb
      .from("chamada_cancelamentos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .single();

    if (!cancelamento) {
      setStatus("Chamada cancelada não encontrada.", true);
      return;
    }

    const alunos = cancelamento.dados_chamada?.alunos || [];
    const chamada = cancelamento.dados_chamada?.chamada || {};

    let csv = "Nome,Email,CPF,Status\n";
    alunos.forEach(a => {
      const presente = a.presente === true || a.presente === 'true';
      csv += `"${a.nome || ''}","${a.email || ''}","${a.cpf || ''}","${presente ? 'Presente' : 'Ausente'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const dataStr = chamada.data_chamada ? new Date(chamada.data_chamada).toISOString().split('T')[0] : 'sem-data';
    link.setAttribute("download", `chamada_cancelada_${chamada.nome_turma || 'turma'}_${dataStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error(e);
    setStatus("Erro ao exportar CSV.", true);
  }
}

async function exportarChamadaCanceladaPDF(chamadaId) {
  try {
    const { data: cancelamento } = await sb
      .from("chamada_cancelamentos")
      .select("*")
      .eq("chamada_id", chamadaId)
      .single();

    if (!cancelamento) {
      setStatus("Chamada cancelada não encontrada.", true);
      return;
    }

    const chamada = cancelamento.dados_chamada?.chamada || {};
    const alunos = cancelamento.dados_chamada?.alunos || [];
    const presentes = alunos.filter(a => a.presente === true || a.presente === 'true').length;
    const ausentes = alunos.filter(a => a.presente === false || a.presente === 'false').length;

    let htmlContent = '<!DOCTYPE html><html><head><title>Chamada Cancelada - ' + (chamada.nome_turma || '') + '</title>';
    htmlContent += '<style>@media print { body { margin: 0; } }';
    htmlContent += 'body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #1f2937; }';
    htmlContent += '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #dc2626; padding-bottom: 20px; }';
    htmlContent += 'h1 { color: #dc2626; margin: 10px 0; font-size: 28px; }';
    htmlContent += 'h2 { color: #991b1b; margin: 5px 0; font-size: 18px; font-weight: 400; }';
    htmlContent += '.info { margin: 20px 0; background: #f9fafb; padding: 20px; border-radius: 8px; }';
    htmlContent += '.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }';
    htmlContent += '.stats { display: flex; gap: 16px; margin-top: 16px; }';
    htmlContent += '.stat-box { padding: 12px 20px; border-radius: 8px; text-align: center; }';
    htmlContent += '.stat-presente { background: #ecfdf5; color: #059669; }';
    htmlContent += '.stat-ausente { background: #fef2f2; color: #dc2626; }';
    htmlContent += '.stat-total { background: #f3f4f6; color: #374151; }';
    htmlContent += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
    htmlContent += 'th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }';
    htmlContent += 'th { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; font-weight: 600; }';
    htmlContent += '.presente { color: #059669; font-weight: 600; }';
    htmlContent += '.ausente { color: #dc2626; font-weight: 600; }';
    htmlContent += '.footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }';
    htmlContent += '.cancelado { background: #fef2f2; padding: 12px; border-left: 4px solid #dc2626; border-radius: 4px; margin-bottom: 20px; }</style></head><body>';
    htmlContent += '<div class="header"><h1>VOLL PILATES GROUP</h1><h2>Chamada Cancelada</h2></div>';
    htmlContent += '<div class="cancelado"><strong>Motivo do Cancelamento:</strong> ' + (cancelamento.motivo_cancelamento || '') + '</div>';
    htmlContent += '<div class="info"><h3 style="color: #dc2626; margin-bottom: 12px;">Informações da Turma</h3>';
    htmlContent += '<div class="info-grid">';
    htmlContent += '<div><strong>Nome da Turma:</strong> ' + (chamada.nome_turma || '') + '</div>';
    htmlContent += '<div><strong>Estado:</strong> ' + (chamada.estado || '') + '</div>';
    htmlContent += '<div><strong>Cidade:</strong> ' + (chamada.cidade || '') + '</div>';
    htmlContent += '<div><strong>Código:</strong> ' + (chamada.codigo_turma || '') + '</div>';
    htmlContent += '<div><strong>Módulo:</strong> ' + (chamada.modulo || '') + '</div>';
    htmlContent += '<div><strong>Data:</strong> ' + formatarDataSemZeros(chamada.data_chamada) + '</div>';
    htmlContent += '</div><div class="stats">';
    htmlContent += '<div class="stat-box stat-presente"><div style="font-size: 24px; font-weight: bold;">' + presentes + '</div><div>Presentes</div></div>';
    htmlContent += '<div class="stat-box stat-ausente"><div style="font-size: 24px; font-weight: bold;">' + ausentes + '</div><div>Ausentes</div></div>';
    htmlContent += '<div class="stat-box stat-total"><div style="font-size: 24px; font-weight: bold;">' + alunos.length + '</div><div>Total</div></div>';
    htmlContent += '</div></div><table><thead><tr><th>Nome</th><th>Email</th><th>CPF</th><th>Status</th></tr></thead><tbody>';
    
    alunos.forEach(function(al) {
      const presente = al.presente === true || al.presente === 'true';
      const statusClass = presente ? 'presente' : 'ausente';
      const statusText = presente ? '✓ Presente' : '✗ Ausente';
      htmlContent += '<tr><td>' + (al.nome || '-') + '</td><td>' + (al.email || '-') + '</td><td>' + (al.cpf || '-') + '</td><td class="' + statusClass + '">' + statusText + '</td></tr>';
    });
    
    htmlContent += '</tbody></table>';
    htmlContent += '<div class="footer"><p>Documento gerado em ' + formatarDataSemZeros(new Date()) + ' - VOLL PILATES GROUP</p></div>';
    htmlContent += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(function() {
      printWindow.print();
    }, 500);
  } catch (e) {
    console.error(e);
    setStatus("Erro ao exportar PDF.", true);
  }
}

/* ============================================
   8. EVENT LISTENERS & INICIALIZAÇÃO
   ============================================ */
setStatus("🔄 Carregando estados...");
carregarEstados();