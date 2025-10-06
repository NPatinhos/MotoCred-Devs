(function () {
  // 1️⃣  Pega o formulário
  const form = document.getElementById('formCadastro');
  if (!form) return;

  // 2️⃣  Config: coloque aqui sua URL do Apps Script
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyJpc89a-1iR2xh7ZEOVe1HJPDCObjuaeO3kmiIYkHF1T_5XCHth1928rC1ncKHB_aRNw/exec";

  // 3️⃣  Função que monta o JSON com os dados
  function serializeFormToPayload(form) {
    const get = (name) => form.elements[name]?.value?.trim() ?? "";
    return {
      tipo_usuario: get("tipo_usuario"),
      loja: get("loja"),
      nome_vendedor: get("nome_vendedor"),
      email_vendedor: get("email_vendedor"),
      nome_cliente: get("nome_cliente"),
      cpf: get("cpf"),
      cnh: get("cnh"),
      email_cliente: get("email_cliente"),
      telefone: get("telefone"),
      renda_mensal: get("renda_mensal"),
      valor_moto: get("valor_moto"),
      valor_entrada: get("valor_entrada"),
    };
  }

  // 4️⃣  Função que faz o POST para o Apps Script
  async function postToAppsScript(payload) {
    const body = new URLSearchParams({ data: JSON.stringify(payload) }).toString();
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });
    return res.json();
  }


    const steps = Array.from(form.querySelectorAll('.form-step'));
    const tabs = Array.from(document.querySelectorAll('.step-tab'));
    const STEP_TITLES = ['Identificacao','Dados do Vendedor','Dados do Cliente','Dados da Venda'];    
    const stepCurrentLabel = document.querySelector('.step-current-label');
    const btnPrev = form.querySelector('.nav-prev');
    const btnNext = form.querySelector('.nav-next');
    const navButtonGroup = form.querySelector('.nav-button-group');
    const navButtonGroupParent = navButtonGroup ? navButtonGroup.parentElement : null;

    const vendorFieldset = document.getElementById('dados_vendedor');
    const clientFieldset = document.getElementById('dados_cliente');
    const motoFieldset = document.querySelector('#step-4 fieldset');
    const tipoUsuarioRadios = Array.from(form.querySelectorAll('input[name="tipo_usuario"]'));
    const cpfInput = document.getElementById('cpf');
    const emailInputs = Array.from(form.querySelectorAll('input[type="email"]'));
    const telefoneInput = document.getElementById('telefone');
    const valorMotoInput = document.getElementById('valor_moto');
    const valorEntradaInput = document.getElementById('valor_entrada');

    let currentStepIndex = 0;
    let maxStepIndex = 0;
    let currentUserType = null;

    const stepAvailability = steps.map(() => true);

    const storeInitialRequiredState = (container) => {
        if (!container) {
            return;
        }
        const elements = container.querySelectorAll('input, select, textarea');
        elements.forEach((element) => {
            if (element.required) {
                element.dataset.wasRequired = 'true';
            }
        });
    };

    const sanitizeCpf = (value) => value.replace(/[^\d]/g, '');

    const formatCpf = (digits) => {
        const clean = digits.slice(0, 11);
        const parts = [
            clean.slice(0, 3),
            clean.slice(3, 6),
            clean.slice(6, 9),
            clean.slice(9, 11)
        ];

        if (!parts[0]) {
            return '';
        }

        let formatted = parts[0];
        if (parts[1]) {
            formatted += `.${parts[1]}`;
        }
        if (parts[2]) {
            formatted += `.${parts[2]}`;
        }
        if (parts[3]) {
            formatted += `-${parts[3]}`;
        }
        return formatted;
    };

    const isValidCpfDigits = (digits) => {
        const cpf = sanitizeCpf(digits);
        if (cpf.length !== 11) {
            return false;
        }
        if (/^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        const calcDigit = (sliceLength) => {
            let sum = 0;
            for (let i = 0; i < sliceLength; i += 1) {
                sum += parseInt(cpf[i], 10) * (sliceLength + 1 - i);
            }
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        const digit1 = calcDigit(9);
        if (digit1 !== parseInt(cpf[9], 10)) {
            return false;
        }

        const digit2 = calcDigit(10);
        if (digit2 !== parseInt(cpf[10], 10)) {
            return false;
        }

        return true;
    };

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    const sanitizePhoneNumber = (value) => value.replace(/[^\d]/g, '');

    const validBrazilianDDDs = new Set([
        '11','12','13','14','15','16','17','18','19',
        '21','22','24','27','28',
        '31','32','33','34','35','37','38',
        '41','42','43','44','45','46','47','48','49',
        '51','53','54','55',
        '61','62','63','64','65','66','67','68','69',
        '71','73','74','75','77','79',
        '81','82','83','84','85','86','87','88','89',
        '91','92','93','94','95','96','97','98','99'
    ]);

    const validateBrazilianCellphone = (digits) => {
        if (!digits) {
            return { valid: true };
        }
        if (digits.length !== 11) {
            return { valid: false, message: 'Informe um telefone com 11 dígitos (DDD + 9 + número).' };
        }
        const ddd = digits.slice(0, 2);
        if (!validBrazilianDDDs.has(ddd)) {
            return { valid: false, message: 'Informe um DDD brasileiro válido.' };
        }
        if (digits[2] !== '9') {
            return { valid: false, message: 'O número deve iniciar com 9 após o DDD.' };
        }
        return { valid: true };
    };

    const calculateValorEntradaMinimo = () => {
        const parsedValue = valorMotoInput && valorMotoInput.value !== '' ? parseFloat(valorMotoInput.value) : NaN;
        const positiveValue = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
        const minimo = positiveValue * 0.4;
        return Math.floor(minimo * 100) / 100;
    };

    // Em script.js

    const updateValorEntradaHint = () => {
        if (!valorMotoInput) {
            return;
        }
        const minimo = calculateValorEntradaMinimo();
        // Formatamos o valor como moeda brasileira (ex: R$ 1.234,56)
        const formatted = minimo.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        // Atualizamos o atributo 'placeholder' do campo de entrada
        if (valorEntradaInput) {
            valorEntradaInput.placeholder = `Entrada mínima sugerida: ${formatted}`;
        }
    };

    const updateCpfValidity = (showMessage = false) => {
        if (!cpfInput || cpfInput.disabled) {
            return true;
        }
        const digits = sanitizeCpf(cpfInput.value);
        if (!digits) {
            cpfInput.setCustomValidity('');
            return true;
        }
        const isValid = isValidCpfDigits(digits);
        if (!isValid) {
            if (showMessage) {
                cpfInput.setCustomValidity('Informe um CPF válido.');
            } else {
                cpfInput.setCustomValidity('');
            }
            return false;
        }
        cpfInput.setCustomValidity('');
        return true;
    };

    const updateEmailValidity = (input, showMessage = false) => {
        if (!input || input.disabled) {
            return true;
        }
        const value = (input.value || '').trim();
        if (!value) {
            input.setCustomValidity('');
            return true;
        }
        if (!emailRegex.test(value)) {
            input.setCustomValidity(showMessage ? 'Informe um e-mail válido.' : '');
            return false;
        }
        input.setCustomValidity('');
        return true;
    };

    const updateTelefoneValidity = (showMessage = false) => {
        if (!telefoneInput || telefoneInput.disabled) {
            return true;
        }
        const digits = sanitizePhoneNumber(telefoneInput.value || '');
        if (!digits) {
            telefoneInput.setCustomValidity('');
            return true;
        }
        const result = validateBrazilianCellphone(digits);
        if (!result.valid) {
            telefoneInput.setCustomValidity(showMessage ? result.message : '');
            return false;
        }
        telefoneInput.setCustomValidity('');
        return true;
    };

    const updateValorEntradaValidity = (showMessage = false) => {
        if (!valorEntradaInput || valorEntradaInput.disabled) {
            return true;
        }

        // CORREÇÃO: Se o campo estiver vazio, limpamos qualquer erro customizado
        // e deixamos o 'required' do HTML cuidar do aviso de campo obrigatório.
        if (valorEntradaInput.value.trim() === '') {
            valorEntradaInput.setCustomValidity(''); 
            return true; // Campo é considerado válido para o JS, mas o HTML o marcará como required
        }
        // FIM DA CORREÇÃO

        const valorMoto = parseFloat(valorMotoInput.value);
        const minimo = calculateValorEntradaMinimo();
        const parsedValue = valorEntradaInput.value !== '' ? parseFloat(valorEntradaInput.value) : NaN;
        const validNumber = Number.isFinite(parsedValue) ? parsedValue : NaN;

        if (!Number.isFinite(validNumber) || validNumber <= 0) {
            valorEntradaInput.setCustomValidity(showMessage ? 'Informe um valor de entrada válido.' : '');
            return false;
        }
        
        if (validNumber > valorMoto) {
            valorEntradaInput.setCustomValidity(showMessage ? 'O valor da entrada não pode ser maior que o valor total da moto.' : '');
            return false;
        }

        if (validNumber + 1e-9 < minimo) {
            valorEntradaInput.setCustomValidity(showMessage ? 'O valor deve ser igual ou superior a 40% do valor da moto.' : '');
            return false;
        }

        valorEntradaInput.setCustomValidity('');
        return true;
    };
    

    const isStepEnabled = (index) => Boolean(stepAvailability[index]);

    const setStepEnabled = (index, enabled) => {
        stepAvailability[index] = enabled;
        const step = steps[index];
        if (!step) {
            return;
        }
        step.classList.toggle('is-hidden-step', !enabled);

        const elements = step.querySelectorAll('input, select, textarea');
        elements.forEach((element) => {
            if (enabled) {
                element.disabled = false;
                if (element.dataset.wasRequired === 'true') {
                    element.required = true;
                }
            } else {
                if (element.required) {
                    element.dataset.wasRequired = 'true';
                }
                element.required = false;
                element.disabled = true;
                if (typeof element.setCustomValidity === 'function') {
                    element.setCustomValidity('');
                }
            }
        });
    };

    const findEnabledStep = (startIndex, direction, includeStart = false) => {
        let index = includeStart ? startIndex : startIndex + direction;
        while (index >= 0 && index < steps.length) {
            if (isStepEnabled(index)) {
                return index;
            }
            index += direction;
        }
        return null;
    };

    const getHighestEnabledIndex = () => {
        let highest = 0;
        stepAvailability.forEach((enabled, index) => {
            if (enabled) {
                highest = index;
            }
        });
        return highest;
    };

    const clearFieldset = (fieldset) => {
        if (!fieldset) {
            return;
        }
        const elements = fieldset.querySelectorAll('input, select, textarea');
        elements.forEach((element) => {
            if (element.type === 'radio' || element.type === 'checkbox') {
                element.checked = false;
            } else if (element.tagName === 'SELECT') {
                element.value = '';
            } else {
                element.value = '';
            }
            if (typeof element.setCustomValidity === 'function') {
                element.setCustomValidity('');
            }
            if (emailInputs.includes(element)) {
                updateEmailValidity(element, false);
            }
            if (telefoneInput && element === telefoneInput) {
                updateTelefoneValidity(false);
            }
        });
        if (fieldset.contains(valorMotoInput)) {
            updateValorEntradaHint();
            updateValorEntradaValidity(false);
        }
    };

    const renderTabs = () => {
        tabs.forEach((tab, index) => {
            const enabled = isStepEnabled(index);
            const isActive = index === currentStepIndex;
            tab.classList.toggle('is-active', isActive);
            tab.classList.toggle('is-complete', enabled && index < maxStepIndex);
            tab.classList.toggle('is-disabled', !enabled);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('aria-disabled', (!enabled).toString());
            const shouldDisable = !enabled || (!isActive && index > maxStepIndex);
            tab.disabled = shouldDisable;
            tab.style.cursor = shouldDisable ? 'default' : '';
            tab.style.pointerEvents = shouldDisable ? 'none' : '';
        });

        // Atualiza o rótulo da etapa atual
        atualizarNomeEtapaAtual();
    };


    const atualizarNomeEtapaAtual = () => {
        if (!stepCurrentLabel) return;

        const activeTab = tabs.find((tab) => tab.classList.contains('is-active'));
        if (activeTab) {
            stepCurrentLabel.textContent = activeTab.innerText.trim();
        }
    };


    const renderSteps = () => {
        steps.forEach((step, index) => {
            const enabled = isStepEnabled(index);
            const isActive = index === currentStepIndex;
            step.classList.toggle('is-active', isActive);
            step.classList.toggle('is-hidden-step', !enabled);
            const shouldHide = !enabled || !isActive;
            step.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
        });
    };

        // Em script.js

   const renderNavigation = () => {
        // Habilita/desabilita o botão Voltar
        btnPrev.disabled = currentStepIndex === 0;

        // Determina se a próxima ação deve ser 'submit' (ou seja, não há próxima etapa habilitada).
        // A função findEnabledStep é usada aqui.
        const shouldSubmit = findEnabledStep(currentStepIndex, 1, false) === null;
        
        // CORREÇÃO: A ação de envio (submit) só é permitida SE shouldSubmit for TRUE 
        // E a etapa atual NÃO for a Etapa 1 (índice 0).
        const isSubmitAction = shouldSubmit && currentStepIndex !== 0;
        
        // Mantém SEMPRE como 'button' para evitar o bug de validação precoce.
        btnNext.type = 'button'; 
        
        btnNext.dataset.action = isSubmitAction ? 'submit' : 'next';
        btnNext.textContent = isSubmitAction ? 'Enviar' : 'Próximo';
        btnNext.setAttribute('aria-label', isSubmitAction ? 'Enviar formulário' : 'Avançar para a próxima etapa');
        
        // Lógica de desabilitar o botão de acordo com a validação (opcional)
        // Você pode ter outras linhas aqui para desabilitar o btnNext que não estão visíveis,
        // mas a lógica principal está acima.
    };

    const showStep = (index) => {
        if (!isStepEnabled(index)) {
            const fallback = findEnabledStep(index, -1, true) ?? findEnabledStep(index, 1, true);
            if (fallback === null) {
                return;
            }
            currentStepIndex = fallback;
        } else {
            currentStepIndex = index;
        }
        renderSteps();
        renderTabs();
        renderNavigation();
        // REMOVIDO: requestAnimationFrame(atualizarNomeEtapaAtual);
    };

    const goToStep = (index) => {
        const normalizedIndex = Math.max(0, Math.min(index, steps.length - 1));
        if (!isStepEnabled(normalizedIndex) || normalizedIndex === currentStepIndex) {
            return;
        }

        if (normalizedIndex > currentStepIndex) {
            if (!validateStep(currentStepIndex)) {
                return;
            }
        }

        if (normalizedIndex > maxStepIndex) {
            maxStepIndex = normalizedIndex;
        }

        showStep(normalizedIndex);
    };

    const handleNext = () => {
        if (!validateStep(currentStepIndex)) {
            return;
        }
            // Ele verifica se estamos saindo da 1ª etapa e se o usuário é comprador
        if (currentStepIndex === 0 && currentUserType === 'comprador') {
            const vendedorTab = tabs[1];
            if (vendedorTab) {
                vendedorTab.classList.add('is-skipped-complete');
            }
        }

        const nextIndex = findEnabledStep(currentStepIndex, 1, false);
        if (nextIndex === null) {
            return;
        }
        maxStepIndex = Math.max(maxStepIndex, nextIndex);
        showStep(nextIndex);
    };

    const handlePrev = () => {
        const previousIndex = findEnabledStep(currentStepIndex, -1, false);
        if (previousIndex === null) {
            return;
        }
        showStep(previousIndex);
    };

    const updateCpfHintValidity = () => {
        updateValorEntradaHint();
        updateValorEntradaValidity(false);
    };

    const refreshContactValidities = () => {
        emailInputs.forEach((input) => updateEmailValidity(input, false));
        updateTelefoneValidity(false);
    };

    const updateStepAvailability = () => {
        const hasUserType = Boolean(currentUserType);
        const isVendor = currentUserType === 'vendedor';

        setStepEnabled(0, true);
        setStepEnabled(1, isVendor);
        setStepEnabled(2, hasUserType);
        setStepEnabled(3, hasUserType);

        const highestEnabled = getHighestEnabledIndex();
        maxStepIndex = Math.min(maxStepIndex, highestEnabled);

        if (!isStepEnabled(currentStepIndex)) {
            const fallback = findEnabledStep(currentStepIndex, -1, true) ?? findEnabledStep(currentStepIndex, 1, true) ?? 0;
            currentStepIndex = fallback;
        }

        renderTabs();
        renderSteps();
        renderNavigation();
        updateCpfHintValidity();
        refreshContactValidities();
    };

    const validateStep = (stepIndex) => {
        if (!isStepEnabled(stepIndex)) {
            return true;
        }
        const step = steps[stepIndex];
        if (!step) {
            return true;
        }
        const fields = Array.from(step.querySelectorAll('input, select, textarea')).filter((field) => !field.disabled);

        for (const field of fields) {
            if (field === cpfInput) {
                updateCpfValidity(true);
            }
            if (emailInputs.includes(field)) {
                updateEmailValidity(field, true);
            }
            if (telefoneInput && field === telefoneInput) {
                updateTelefoneValidity(true);
            }
            if (field === valorEntradaInput) {
                updateValorEntradaValidity(true);
            }

            // Se a validação do campo falhar, reporte o erro e interrompa.
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        } 

        return true;
    };

    storeInitialRequiredState(vendorFieldset);
    storeInitialRequiredState(clientFieldset);
    storeInitialRequiredState(motoFieldset);

    setStepEnabled(0, true);
    setStepEnabled(1, false);
    setStepEnabled(2, false);
    setStepEnabled(3, false);

    updateCpfHintValidity();
    refreshContactValidities();

    const preselected = tipoUsuarioRadios.find((radio) => radio.checked);
    if (preselected) {
        currentUserType = preselected.value;
    }

    updateStepAvailability();
    showStep(0);

    // Em script.js

    // Em script.js

    tipoUsuarioRadios.forEach((radio) => {
        radio.addEventListener('change', (event) => {
            const selectedType = event.target.value;
            const vendedorTab = tabs[1]; // A aba "Dados do Vendedor"

            // Limpa a marcação de "pulado" se o usuário selecionar "Vendedor"
            if (selectedType === 'vendedor') {
                if (vendedorTab) vendedorTab.classList.remove('is-skipped-complete');
            }

            // Lógica existente para limpar os campos e resetar o progresso
            if (currentUserType && currentUserType !== selectedType) {
                if (selectedType === 'comprador') {
                    clearFieldset(vendorFieldset);
                } else {
                    clearFieldset(clientFieldset);
                }
                maxStepIndex = Math.min(maxStepIndex, 0);
            }

            currentUserType = selectedType;
            updateStepAvailability();
        });
    });

    if (btnNext) {
        btnNext.dataset.action = 'next';
        btnNext.addEventListener('click', () => {
            if (btnNext.dataset.action === 'submit') {
                if (!validateStep(currentStepIndex)) {
                    return;
                }
                if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                } else {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
                return;
            }
            handleNext();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', handlePrev);
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            if (tab.disabled) {
                return;
            }
            goToStep(index);
        });
    });

    if (cpfInput) {
        cpfInput.addEventListener('input', (event) => {
            const digits = sanitizeCpf(event.target.value);
            event.target.value = formatCpf(digits);
            updateCpfValidity(false);
        });
        cpfInput.addEventListener('blur', () => {
            updateCpfValidity(false);
        });
    }

    emailInputs.forEach((input) => {
        input.addEventListener('input', () => {
            updateEmailValidity(input, false);
        });
        input.addEventListener('blur', () => {
            updateEmailValidity(input, false);
        });
    });

    if (telefoneInput) {
        telefoneInput.addEventListener('input', () => {
            updateTelefoneValidity(false);
        });
        telefoneInput.addEventListener('blur', () => {
            updateTelefoneValidity(false);
        });
    }

    if (valorMotoInput) {
        valorMotoInput.addEventListener('input', () => {
            updateCpfHintValidity();
            // ADICIONADO: Revalida a entrada quando o valor da moto é alterado
            updateValorEntradaValidity(false); 
        });
    }

    if (valorEntradaInput) {
        valorEntradaInput.addEventListener('input', () => {
            updateValorEntradaValidity(false);
        });
        valorEntradaInput.addEventListener('blur', () => {
            updateValorEntradaValidity(false);
        });
    }

     // 👇 E no final do arquivo, antes de fechar o parêntese da função:
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // se quiser, use sua função validateStep
    if (typeof validateStep === "function" && typeof currentStepIndex === "number") {
      if (!validateStep(currentStepIndex)) return;
    }

    const payload = serializeFormToPayload(form);
    console.log("Enviando payload:", payload);

    try {
      const result = await postToAppsScript(payload);
      if (result?.ok) {
        alert("Enviado com sucesso! 🎉");
        form.reset();
      } else {
        alert("Erro ao enviar: " + (result?.error || "desconhecido"));
      }
    } catch (err) {
      console.error("Erro de rede:", err);
      alert("Falha ao enviar. Veja o console.");
    }
  });

})(); // 👈 essa linha fecha tudo
