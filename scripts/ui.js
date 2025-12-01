
// mostra cada tela
export function mostrarSection(section){
    if (section == "ppa") {
        document.getElementById("ppa").classList.remove("hidden");
        document.getElementById("simulacao").classList.add("hidden");
        document.getElementById("reprovado").classList.add("hidden");

        document.getElementById("form-navigation").classList.remove("hidden")
        document.getElementById("btn-ppa").classList.remove("hidden")
        document.getElementById("btn-analise-final").classList.add("hidden")

    }
    elif(section == "reprovado"){
        document.getElementById("reprovado").classList.remove("hidden");
        document.getElementById("simulacao").classList.add("hidden");
        document.getElementById("ppa").classList.add("hidden");

        document.getElementById("form-navigation").classList.add("hidden")
    }
    elif(section == "simulacao"){
        document.getElementById("simulacao").classList.remove("hidden");
        document.getElementById("reprovado").classList.add("hidden");
        document.getElementById("ppa").classList.add("hidden");

        document.getElementById("form-navigation").classList.remove("hidden")
        document.getElementById("btn-ppa").classList.add("hidden")
        document.getElementById("btn-analise-final").classList.remove("hidden")
    }
}

export function limparMensagensErroPPA(){
    document.getElementById("erroPPA").classList.add("hidden")
}

export function mensagensErroPPA(motivos, sugestoes){
    const sectionErroPPA = document.getElementById("erroPPA");
    const listaMotivos = document.getElementById("motivos-ppa");
    const listaSugestoes = document.getElementById("sugestoes-ppa");
   
    let htmlMotivos = "";
    if (motivos && motivos.length > 0) {
        htmlMotivos = motivos.map(m => `• ${m}`).join("<br>");
    }

    let htmlSugestoes = "";
    if (sugestoes && sugestoes.length > 0) {
        htmlSugestoes = sugestoes.map(s => `• ${s}`).join("<br>");
    }

    listaMotivos.innerHTML = htmlMotivos;
    listaSugestoes.innerHTML = htmlSugestoes;

    box.classList.remove("hidden");
}
// sugestoes ppa