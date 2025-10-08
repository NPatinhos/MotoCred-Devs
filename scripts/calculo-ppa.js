/**
 * PPA (Pré-Pré-Análise) em Tempo Real
 * Contém a lógica de regras e cálculos para determinar a aprovação e fornecer sugestões.
 * @param {number} valorMoto - Valor total da moto que está sendo adquirida.
 * @param {number} entrada - Valor da entrada que o cliente irá fornecer.
 * @param {number} renda - Renda mensal comprovada do cliente.
 * @returns {object} Um objeto contendo o status de aprovação, motivos e sugestões.
 */

// ----------------------------------------------------------------------
// FUNÇÕES AUXILIARES DE CÁLCULO
// ----------------------------------------------------------------------

/**
 * Calcula o Valor Total do Financiamento (Valor Financiado + Taxas Fixas).
 */
function calcularValorTotal(valorFinanciado) {
    if (valorFinanciado <= 5000) {
        return valorFinanciado + 770;
    } else if (valorFinanciado > 5000 && valorFinanciado <= 7000) {
        return valorFinanciado + 820;
    } else if (valorFinanciado > 7000 && valorFinanciado <= 10000) {
        return valorFinanciado + 870;
    } else {
        // Para valores financiados acima de 10.000
        return valorFinanciado + 920; 
    }
}

/**
 * Calcula o Valor Máximo de Crédito que pode ser financiado com base na Renda.
 * Usa a fórmula inversa da parcela e o limite de 1/3 da renda.
 */
function calcularValorMaximo(renda) {
    const parcelaMaxima = renda / 3;
    const taxas = [
        { limite: 5000, taxa: 770 },
        { limite: 7000, taxa: 820 },
        { limite: 10000, taxa: 870 },
        { limite: Infinity, taxa: 920 }
    ];
    
    for (const { limite, taxa } of taxas) {
        // Fórmula: (Parcela Máxima * 36 meses / Fator 2.44) - Taxa Fixa
        const valor = (parcelaMaxima * 36 / 2.44) - taxa;

        // Se o valor calculado cair dentro da faixa de limite da taxa, ele é o máximo.
        if (valor <= limite) {
            return Math.max(valor, 0); 
        }
    }
    
    return 0;
}

// ----------------------------------------------------------------------
// FUNÇÃO PRINCIPAL DE PRÉ-ANÁLISE (PPA)
// ----------------------------------------------------------------------

function realizarPPA(valorMoto, entrada, renda) {
    // Inicialização
    const motivoReprovacao = [];
    let reprovadoPorParcela = false;
    let reprovadoPorVLFINANCIADO = false;
    
    // Cálculos Iniciais
    const valorFinanciado = valorMoto - entrada;
    const valorTotal = calcularValorTotal(valorFinanciado);
    const parcela36 = (valorTotal * 2.44) / 36; // Parcela estimada em 36 meses

    // ----------------------------------------------------------------------
    // 1. REGRAS DE REPROVAÇÃO
    // ----------------------------------------------------------------------

    // A. Regras de Entrada
    if (entrada < 4000) {
        motivoReprovacao.push("Entrada mínima de R$ 4.000,00 não atingida");
    }
    if (entrada < valorMoto * 0.4) {
        motivoReprovacao.push("Entrada menor que 40% do valor da moto");
    }

    // B. Limite de Crédito (Teto de R$ 12.000)
    if (valorFinanciado > 12000) {
        motivoReprovacao.push("Crédito solicitado acima do limite (R$ 12.000,00)");
        reprovadoPorVLFINANCIADO = true;
    }

    // C. Comprometimento de Renda (1/3 da Renda)
    if (parcela36 > renda / 3) {
        motivoReprovacao.push("Parcela excede 1/3 da renda");
        reprovadoPorParcela = true;
    }

    // ----------------------------------------------------------------------
    // 2. CÁLCULO DE SUGESTÕES
    // ----------------------------------------------------------------------

    let valorMaximoFinanciavel = calcularValorMaximo(renda);
    // O valor máximo financiável é o menor entre o limite por renda e o teto da empresa
    if (valorMaximoFinanciavel > 12000) {
        valorMaximoFinanciavel = 12000;
    }

    // Sugestão de aumento de entrada (para financiar o valor da moto atual)
    const novaEntradaSugerida = valorMoto - valorMaximoFinanciavel;
    
    // Sugestão de valor de moto (mantendo a entrada atual)
    const novaMotoSugerida = entrada + valorMaximoFinanciavel;


    // ----------------------------------------------------------------------
    // 3. SUGESTÕES ESPECÍFICAS PARA REPROVAÇÕES DE ENTRADA (Cenário 3 do AppsScript)
    // ----------------------------------------------------------------------
    let entradaMinimaRequerida = 0;
    let motoMaximaComEntrada = 0;

    if (!reprovadoPorVLFINANCIADO && !reprovadoPorParcela && motivoReprovacao.length > 0) {
        // Se a falha é SÓ por entrada (motivoReprovacao.length > 0)
        
        // Entrada mínima é o maior entre 4000 e 40%
        entradaMinimaRequerida = Math.max(valorMoto * 0.4, 4000);
        
        // Moto máxima que pode ser comprada (o valor da entrada é 40% do total, ou seja, Moto = Entrada / 0.4)
        motoMaximaComEntrada = entrada / 0.4;
    }


    // ----------------------------------------------------------------------
    // 4. RETORNO DO RESULTADO
    // ----------------------------------------------------------------------

    return {
        // Status da PPA
        aprovado: motivoReprovacao.length === 0,
        motivos: motivoReprovacao,

        // Flags para formatação da mensagem
        reprovadoPorVLFINANCIADO: reprovadoPorVLFINANCIADO,
        reprovadoPorParcela: reprovadoPorParcela,
        
        // Sugestões
        valorMaximoFinanciavel: Math.max(valorMaximoFinanciavel, 0),
        novaEntradaSugerida: Math.max(novaEntradaSugerida, 0), // Garante que não é negativo
        novaMotoSugerida: Math.max(novaMotoSugerida, 0),
        entradaMinimaRequerida: entradaMinimaRequerida,
        motoMaximaComEntrada: motoMaximaComEntrada
    };
}


// --- FUNÇÃO PARA FORMATAR E EXIBIR A MENSAGEM DE REPROVAÇÃO ---
function exibirMensagemDeErro(resultado, feedbackArea) {
    let mensagemHTML = '<p style="font-weight: bold;">❌ Pré-Análise Não Concedida. Por favor, ajuste os valores e tente novamente.</p>';
    
    // Adicione a formatação para moeda brasileira (vírgula)
    const formatBRL = (num) => num.toFixed(2).replace('.', ',');

    // --- Cenas 1 e 2: Reprovação por Crédito ou Renda ---
    if (resultado.reprovadoPorVLFINANCIADO || resultado.reprovadoPorParcela) {
        
        const focoMensagem = resultado.reprovadoPorVLFINANCIADO 
                             ? "ultrapassa o máximo de crédito que oferecemos" 
                             : "sua renda não é suficiente para o crédito solicitado";

        mensagemHTML += `<p>O pedido foi reprovado porque **${focoMensagem}**.</p>`;
        mensagemHTML += `<p>O valor máximo que podemos financiar é **R$ ${formatBRL(resultado.valorMaximoFinanciavel)}**.</p>`;
        mensagemHTML += `<ul>`;
        
        if (resultado.novaEntradaSugerida > resultado.entrada) {
            mensagemHTML += `<li>**SUGESTÃO:** Aumente sua entrada para pelo menos **R$ ${formatBRL(resultado.novaEntradaSugerida)}**; OU</li>`;
        }
        if (resultado.novaMotoSugerida < resultado.valorMoto) {
            mensagemHTML += `<li>**SUGESTÃO:** Escolha uma moto de até **R$ ${formatBRL(resultado.novaMotoSugerida)}** (mantendo a entrada atual).</li>`;
        }
        mensagemHTML += `</ul>`;
    } 
    // --- Cena 3: Reprovado Apenas por Regras de Entrada ---
    else {
        
        mensagemHTML += `<p>Seu pedido foi reprovado pelos seguintes motivos:</p>`;
        mensagemHTML += `<ul><li>${resultado.motivos.join('</li><li>')}</li></ul>`;
        
        mensagemHTML += `<p>Para ser aprovado, sugerimos que você:</p><ul>`;
        mensagemHTML += `<li>**SUGESTÃO:** Aumente sua entrada para pelo menos **R$ ${formatBRL(resultado.entradaMinimaRequerida)}**; OU</li>`;
        mensagemHTML += `<li>**SUGESTÃO:** Escolha uma moto de até **R$ ${formatBRL(resultado.motoMaximaComEntrada)}** (mantendo a entrada atual).</li></ul>`;
    }
    
    feedbackArea.innerHTML = mensagemHTML;
}


const cleanAndParse = (inputElement) => {
    // 1. Pega o valor do input.
    const rawValue = inputElement.value;
    // 2. Remove todos os pontos de milhar (ex: '10.000,00' -> '10000,00')
    const noThousands = rawValue.replace(/\./g, '');
    // 3. Troca a vírgula decimal por ponto (ex: '10000,00' -> '10000.00')
    const cleanValue = noThousands.replace(',', '.');
    // 4. Converte para número e retorna 0 se for inválido
    return parseFloat(cleanValue) || 0;
};

// --- FUNÇÃO PARA FORMATAR E EXIBIR A MENSAGEM DE REPROVAÇÃO ---
function exibirMensagemDeErro(resultado, feedbackArea) {
    let mensagemHTML = '<p style="font-weight: bold;">❌ Pré-Análise Não Concedida. Por favor, ajuste os valores e tente novamente.</p>';
    
    // Adicione a formatação para moeda brasileira (vírgula)
    const formatBRL = (num) => num.toFixed(2).replace('.', ',');

    // --- Cenas 1 e 2: Reprovação por Crédito ou Renda ---
    if (resultado.reprovadoPorVLFINANCIADO || resultado.reprovadoPorParcela) {
        
        const focoMensagem = resultado.reprovadoPorVLFINANCIADO 
                             ? "ultrapassa o máximo de crédito que oferecemos" 
                             : "sua renda não é suficiente para o crédito solicitado";

        mensagemHTML += `<p>O pedido foi reprovado porque **${focoMensagem}**.</p>`;
        mensagemHTML += `<p>O valor máximo que podemos financiar é **R$ ${formatBRL(resultado.valorMaximoFinanciavel)}**.</p>`;
        mensagemHTML += `<ul>`;
        
        if (resultado.novaEntradaSugerida > resultado.entrada) {
            mensagemHTML += `<li>**SUGESTÃO:** Aumente sua entrada para pelo menos **R$ ${formatBRL(resultado.novaEntradaSugerida)}**; OU</li>`;
        }
        if (resultado.novaMotoSugerida < resultado.valorMoto) {
            mensagemHTML += `<li>**SUGESTÃO:** Escolha uma moto de até **R$ ${formatBRL(resultado.novaMotoSugerida)}** (mantendo a entrada atual).</li>`;
        }
        mensagemHTML += `</ul>`;
    } 
    // --- Cena 3: Reprovado Apenas por Regras de Entrada ---
    else {
        
        mensagemHTML += `<p>Seu pedido foi reprovado pelos seguintes motivos:</p>`;
        mensagemHTML += `<ul><li>${resultado.motivos.join('</li><li>')}</li></ul>`;
        
        mensagemHTML += `<p>Para ser aprovado, sugerimos que você:</p><ul>`;
        mensagemHTML += `<li>**SUGESTÃO:** Aumente sua entrada para pelo menos **R$ ${formatBRL(resultado.entradaMinimaRequerida)}**; OU</li>`;
        mensagemHTML += `<li>**SUGESTÃO:** Escolha uma moto de até **R$ ${formatBRL(resultado.motoMaximaComEntrada)}** (mantendo a entrada atual).</li></ul>`;
    }
    
    feedbackArea.innerHTML = mensagemHTML;
}

/* VERIFICANDO A FUNCIONALIDADE DO PPA TENTANDO COLOCAR ELE NO BLOCO COLORIDO NO FINAL*/