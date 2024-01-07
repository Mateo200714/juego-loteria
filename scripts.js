window.addEventListener("load", () => {
    setTimeout(() => {
        actualizar_variables()
        actualizar_nivel_experiencia()
        actualizar_dinero()
        actualizar_apuesta()
        actualizar_productos_tienda_bonus()
    }, 100)
})

function actualizar_variables() {
    fetch('http://127.0.0.1:5500/base_datos_local/variables.json')
        .then((res) => {
            return res.json()
        })
        .then((data) => {
            boletos_comprados = data.boletos_comprados
            ComprarBoleto_permitido = data.ComprarBoleto_permitido
            VerGanador_permitido = data.VerGanador_permitido
            AbrirTienda_permitido = data.AbrirTienda_permitido
        })
}
let boletos_comprados = []//array de objetos
let ComprarBoleto_permitido = true
let VerGanador_permitido = false
let AbrirTienda_permitido = true

let animacion_sumar_dinero
function actualizar_dinero(dinero_sumar = 0, operacion, accion) {
    //actualizar dinero
    if (dinero_sumar !== 0) {
        clearTimeout(animacion_sumar_dinero)
        if (dinero_sumar < 0) {//negativo(rojo)
            document.getElementById("div-dinero-sumar").style.color = 'red'
        }
        else {//positivo(verde)
            document.getElementById("div-dinero-sumar").style.color = 'rgb(20, 144, 20)'
        }
        document.getElementById("div-dinero-sumar").innerHTML = operacion
        mostrar_cambio_dinero()
        let time = 1250
        if (dinero_sumar > 0) {
            time = 2500
        }
        animacion_sumar_dinero = setTimeout(() => {
            esconder_cambio_dinero()
        }, time)
    }
    const dinero_obtenido = get_dinero_jugador()
    const dinero_final = (dinero_obtenido + dinero_sumar) <= 9999999 ? dinero_obtenido + dinero_sumar : 9999999
    localStorage.setItem("dinero_total_usuario", dinero_final)
    //actualizar historial

    //actualizar pantalla
    document.getElementById("text-dinero-total").innerHTML = dinero_final.toLocaleString()
}
function comprar_boleto() {
    document.getElementById('numero-ganador-1').innerHTML = 0
    document.getElementById('numero-ganador-2').innerHTML = 0
    const dinero_boleto = get_dinero_apuesta_jugador()
    const dinero_jugador = get_dinero_jugador()
    if (ComprarBoleto_permitido && (dinero_boleto <= dinero_jugador) && dinero_boleto > 0) {
        cerrar_tienda()
        //actualziar dinero
        actualizar_dinero(-dinero_boleto, `- ${dinero_boleto}`, 'Boletos')
        //obtener boleto
        let numero_boleto;
        while (numero_boleto === undefined) {
            let encontrado = false;
            const numero = Math.floor(Math.random() * 50 + 1)
            for (let i = 0; i < boletos_comprados.length; i++) {
                if (boletos_comprados[i].numero === numero) {
                    encontrado = true
                    break
                }
            }
            if (!encontrado) {
                numero_boleto = numero
            }
        }
        //guardar boelto
        boletos_comprados.push({ numero: numero_boleto, dinero: dinero_boleto })
        //ordenar boletos(<)
        boletos_comprados.sort(function (a, b) { return a.numero - b.numero; });
        //mostrar boletos ordenados
        document.getElementById("boletos-comprados-div").innerHTML = "";
        for (let i = 0; i < boletos_comprados.length; i++) {
            document.getElementById("boletos-comprados-div").innerHTML += `<div class="boleto-conseguido"> <img draggable="false" src="./imgs/boleto.png" alt="" class="img-boleto-conseguido"><h5 class="text-dinero-boleto">${boletos_comprados[i].dinero}<font>€</font>
        </h5><h3 class="text-numero-boelto">${boletos_comprados[i].numero}</h3></div>`;
        }
        actualizar_apuesta()
        VerGanador_permitido = true
    }
}
let interval_spin
function animacion_spin() {
    if (VerGanador_permitido) {
        AbrirTienda_permitido = false
        cerrar_tienda()
        ComprarBoleto_permitido = false; VerGanador_permitido = false
        //animacion spin
        let numero_veces = 55
        let numero1_anterior, numero2_anterior
        clearInterval(interval_spin)
        let time = 65
        interval_spin = setInterval(resolve => {
            numero_veces--
            let numero1 = 0, numero2 = 0
            do {
                numero1 = Math.floor(Math.random() * 5)
            } while (numero1 === numero1_anterior)
            do {
                if (numero1 === 0) {
                    numero2 = Math.floor(Math.random() * 9 + 1)
                }
                else {
                    numero2 = Math.floor(Math.random() * 9)
                }
            } while (numero2 === numero2_anterior)
            numero1_anterior = numero1
            numero2_anterior = numero2
            if (numero_veces <= 15 && numero_veces >= 10) {
                time = 75
            }
            else if (numero_veces < 10 && numero_veces > 5) {
                time = 85
            }
            else if (numero_veces <= 5 && numero_veces > 2) {
                time = 105
            }
            else if (numero_veces === 2) {
                time = 120
            }
            else if (numero_veces === 1) {
                time = 145
            }

            if (numero1 != undefined && numero2 != undefined) {
                //actualizar pantalla
                document.getElementById('numero-ganador-1').innerHTML = numero1
                document.getElementById('numero-ganador-2').innerHTML = numero2
            }
            if (numero_veces <= 0) {
                clearInterval(interval_spin)
                mostrar_boleto_ganador()
            }
        }, 65)
    }
}
function mostrar_boleto_ganador() {//falta verificacion
    let numero_tocado;//numero ganador

    //formula1 --> numero principal -( (1 * b.pequeño) + (1.8 * b.medianos) + (2.5 * b.grandes) + (4 * b.enormes))
    const principal_añadido = [1, 3]
    let indice_principal_añadido;//nivel-->
    let Bpequeño = 0, Bmediano = 0, Bgrandes = 0, Benormes = 0;
    //clasificar boletos comprados
    boletos_comprados.forEach(boleto => {
        const dinero = boleto.dinero
        if (dinero <= 500) {//boleto pequeño
            Bpequeño++
        }
        else if (dinero <= 2500) {//boleto mediano
            Bmediano++
        }
        else if (dinero <= 12500) {//boleto grande
            Bgrandes++
        }
        else {//boleto enorme
            Benormes++
        }
    })
    //calcular formula 1
    const probabilidad = (1 * Bpequeño) + (1.8 * Bmediano) + (2.5 * Bgrandes) + (4 * Benormes)
    //calcular formula2 si entra en la probabilidad o consigue la escapatoria (Math.floor(Math.random() * 100)) === 0)
    if ((((Math.random() * principal_añadido[indice_principal_añadido]).toFixed(1)) <= probabilidad) || ((Math.floor(Math.random() * 100)) === 0)) {//elegir boleto tocado
        const probabilidad1 = (Math.random() * 1).toFixed(2)
        if (probabilidad1 <= 0.2 && boletos_comprados.length < 50) {//no toca
            //obtener numeros en posesion
            let numeros = []
            for (let i = 1; i < 51; i++) {
                numeros.push(i)
            }
            boletos_comprados.forEach(boleto => {
                numeros.splice(numeros.indexOf(boleto.numero), 1)
            })
            numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
        }
        else if (probabilidad1 <= 0.35) {//enorme
            //coger todos los numeros enormes
            const numeros = boletos_comprados.filter(boleto => boleto.dinero > 12500).map(boleto => boleto.numero)
            numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
        }
        else if (probabilidad1 <= 0.70) {//grande
            //coger todos los numeros grandes
            const numeros = boletos_comprados.filter(boleto => (boleto.dinero > 2500 && boleto.dinero <= 12500)).map(boleto => boleto.numero)
            numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
        }
        else if (probabilidad1 <= 1) {//pequeño/mediano
            const probabilidad2 = (Math.random() * 1).toFixed(1)
            if (probabilidad2 <= 0.6) {//pequeño
                const numeros = boletos_comprados.filter(boleto => boleto.dinero <= 500).map(boleto => boleto.numero)
                numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
            }
            else {//mediano
                const numeros = boletos_comprados.filter(boleto => (boleto.dinero > 500 && boleto.dinero <= 2500)).map(boleto => boleto.numero)
                numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
            }
        }
    }
    else {//numero no tocado
        //obtener numeros en posesion
        let numeros = []
        for (let i = 1; i < 51; i++) {
            numeros.push(i)
        }
        boletos_comprados.forEach(boleto => {
            numeros.splice(numeros.indexOf(boleto.numero), 1)
        })
        numero_tocado = numeros[Math.floor(Math.random() * (numeros.length - 1))]
    }
    //comnprobar ganador
    const datos_comprobar = comprobar_boletos_comprados_ganador(numero_tocado)
    //actualizar pantalla
    const numero_tocado_text = numero_tocado.toString()
    if (numero_tocado_text[1] === undefined) {
        document.getElementById('numero-ganador-1').innerHTML = 0
        document.getElementById('numero-ganador-2').innerHTML = numero_tocado_text[0]
    }
    else {
        document.getElementById('numero-ganador-1').innerHTML = numero_tocado_text[0]
        document.getElementById('numero-ganador-2').innerHTML = numero_tocado_text[1]
    }
    console.log(numero_tocado)
    mostrar_recompensas(datos_comprobar[0], numero_tocado, datos_comprobar[1])
}
function comprobar_boletos_comprados_ganador(numero_ganador) {
    let encontrado = false
    let dinero_apostado
    boletos_comprados.forEach(boleto => {
        if (boleto.numero === numero_ganador) {
            encontrado = true
        }
    })
    return [encontrado, dinero_apostado]
}
function mostrar_recompensas(ganar, numero_ganador, dinero_apostado) {
    let recompensa_final;
    if (ganar) {
        //calcular multiplicador victoria
        let multiplicador = 0.75;
        //por cifras
        if ((numero_ganador[0] === numero_ganador[1]) && (numero_ganador.length === 2)) {//numero repetido Ej.11,22...; *0.6
            multiplicador += 0.6
        }
        else if (numero_ganador % 10 === 0) {//multiplo de 10; 0.45
            multiplicador += 0.45
        }
        if (numero_ganador[0] > numero_ganador[1] && numero_ganador.length === 2) {
            multiplicador += 0.25
        }
        else if (numero_ganador[1] > numero_ganador[0] && numero_ganador.length === 2) {
            multiplicador += 0.2
        }
        else if (numero_ganador.length === 2) {
            multiplicador += 0.15
        }
        else if (numero_ganador.length === 1) {//solo una cifra Ej.1,2,3...9; *0.3
            multiplicador += 0.35
        }
        //por divisores
        if (numero_ganador % 3 === 0) {//multiplo de 3; *0.15
            multiplicador += 0.15
        }
        if (numero_ganador % 5 === 0) {//multiplo de 5; *0.2
            multiplicador += 0.2
        }
        if (numero_ganador % 2 === 0) {//multiplo de 2; *0.07
            multiplicador += 0.1
        }
        if (numero_ganador % 7 === 0) {//multiplo de 7; *0.13
            multiplicador += 0.18
        }
        //por tamaño del numero
        if (numero_ganador === 50) {//numero mayor
            multiplicador += 0.5
        }
        else if (numero_ganador === 25) {//numero mediano
            multiplicador += 0.38
        }
        else if (numero_ganador < 25) {//numero menor
            multiplicador += 0.24
        }
        else if (numero_ganador > 25) {//numero grande
            multiplicador += 0.3
        }
        //por bonus (sin terminar)
        /*const lista_bonus_multiplicadores = JSON.parse(get_bonus_multiplicador_jugador())
        //temporales
        lista_bonus_multiplicadores.bonus_temporal_fecha.forEach(bonus => {
            multiplicador += bonus.multiplicador
        })
        //cantidad partidas
        lista_bonus_multiplicadores.bonus_numero_partidas.forEach(bonus => {
            multiplicador += bonus.multiplicador
        })
        */
        //calcular recompensa
        recompensa_final = dinero_apostado * multiplicador
        //actualizar pantalla
        actualizar_dinero(recompensa_final, `+ ${dinero_apostado} * ${multiplicador}`)
    }
    //actualizar pantalla
    if (ganar) {
        document.getElementsByClassName('img-titulo-fin-partida')[0].src = './imgs/ganador.png'
    }
    else {
        document.getElementsByClassName('img-titulo-fin-partida')[0].src = './imgs/perdedor.png'
    }
    animacion_resultado_partida()
    boletos_comprados = []
    AbrirTienda_permitido = true
    setTimeout(() => {
        vaciar_lista_boletos_comprados()
        ComprarBoleto_permitido = true
        VerGanador_permitido = false
    }, 700)
    //25 == 1 exp
    const experiancia_final = recompensa_final / 25
    actualizar_nivel_experiencia(experiancia_final)
}

function actualizar_nivel_experiencia(experiencia_ganada = 0) {
    const experiencia_niveles = [1, 3, 5, 10]//2...
    const experiencia_actual_jugador = get_experiencia_jugador()
    const nivel_actual_jugador = get_nivel_jugador()
    //subir nivel?
    if ((experiencia_actual_jugador + experiencia_ganada) >= experiencia_niveles[nivel_actual_jugador - 1]) {
        localStorage.setItem('nivel_actual_usuario', nivel_actual_jugador + 1)
        localStorage.setItem('experiencia_actual_usuario', ((experiencia_actual_jugador + experiencia_ganada) - experiencia_niveles[nivel_actual_jugador - 1]))
    }
    //actualizar pantalla
    const porcentaje_progreso = ((get_experiencia_jugador() * 100) / experiencia_niveles[get_nivel_jugador() - 1]).toFixed(3)
    const porcentaje = ((porcentaje_progreso / 1500) < 3) ? 3 : (porcentaje_progreso / 1500)
    let porcentaje_completo = 0
    const interval_animacion = setInterval(() => {
        document.getElementById('div-barra-progreso-nivel').style.background = `conic-gradient(#1e77e3 ${porcentaje_completo + porcentaje}%, rgb(24, 24, 24) 0%)`
        porcentaje_completo += porcentaje
        if (porcentaje_completo >= porcentaje_progreso) {
            clearInterval(interval_animacion)
        }
    }, 22);
    document.getElementById("div-interior-barra-progreso-nivel").innerHTML = `Level </br>${get_nivel_jugador()}`//nivel
}

let menu_boletos_mostrado = true
function mostrar_esconder_menu_boletos() {
    if (menu_boletos_mostrado) {//cerrar
        esconder_menu_boletos()
    }
    else {//abrir
        mostrar_menu_boletos()
    }
    menu_boletos_mostrado = !menu_boletos_mostrado
}
//tienda
{
    let interval_actualizacion_time_productos;
    function actualizar_productos_tienda_bonus() {
        document.getElementById('div-body-tienda-bonus').scrollTo(0, 0)
        //datos productos
        const productos_tienda = [
            { id: '1-1', bonus: 0.3, precio: 'ad', caducidad: '4pd' },
            { id: '1-2', bonus: 0.2, precio: 10, caducidad: '3pd' },
            { id: '1-3', bonus: 0.15, precio: 25, caducidad: '0,3h' }
        ]
        //actualizar pantalla
        let producto_activos_usuario = get_bonus_multiplicador_jugador()
        let productos_activos = []
        document.getElementById('div-body-tienda-bonus').innerHTML = `<div id="dinero-jugador-tienda"><font>$</font> ${get_dinero_jugador()}</div>`
        for (let i = 0; i < productos_tienda.length; i++) {
            //buscar si el producto ya esta activo
            const resultado_busqueda_producto = producto_activos_usuario.indexOf(producto => { return producto.id === productos_tienda[i].id })
            const precio_producto = (productos_tienda[i].precio != 'ad') ? '$ ' + productos_tienda[i].precio : 'ad'
            if ((resultado_busqueda_producto != -1)) {//activo
                const letra_tipo_caducidad = productos_tienda[i].caducidad[productos_tienda[i].caducidad.length - 1]
                if (letra_tipo_caducidad == 'h') {//por tiempo
                    productos_activos.push(producto_activos_usuario[resultado_busqueda_producto])
                    const tiempo_restante = producto_activos_usuario[resultado_busqueda_producto].caduca.replaceAll('h', '') - new Date()
                    const horas_restantes = Math.trunc(tiempo_restante / 3600000)
                    const minutos_restantes = Math.ceil((tiempo_restante % 3600000) / 60000)
                    let tiempo_mostrar = horas_restantes.toLocaleString();
                    if (minutos_restantes > 1) {
                        tiempo_mostrar = horas_restantes.toLocaleString() + ',' + minutos_restantes
                    }
                    //mostrar producto (diseño activo)
                    document.getElementById('div-body-tienda-bonus').innerHTML += `<div class="div-producto-tienda" id="id-producto-${productos_tienda[i].id}"><div class="text-bonus-producto">${productos_tienda[i].bonus}</div><div class="text-caducidad-bonus-producto"><div class="text-caducidad">Caduca:</div><div class="text-tiempo-caducidad text-tiempo-caducidad-activo">${tiempo_mostrar}h</div></div><input class="bt-comprar-producto-bonus bt-comprar-producto-bonus-activo" type = "button" value = "${precio_producto}"></div>`
                }
                else {//por numero de partidas
                    //mostrar producto (diseño comprar)
                    document.getElementById('div-body-tienda-bonus').innerHTML += `<div class="div-producto-tienda"id="id-producto-${productos_tienda[i].id}"><div class="text-bonus-producto">${productos_tienda[i].bonus}</div><div class="text-caducidad-bonus-producto"><div class="text-caducidad">Caduca:</div><div class="text-tiempo-caducidad text-tiempo-caducidad-no-activo">${productos_tienda[i].caducidad}</div></div><input class="bt-comprar-producto-bonus bt-comprar-producto-bonus-no-activo" type = "button" value = "${precio_producto}" ></div>`
                }
            }
            else {//no activo
                const datos_productos = {
                    id: productos_tienda[i].id,
                    bonus: productos_tienda[i].bonus,
                    caducidad: productos_tienda[i].caducidad,
                    precio: productos_tienda[i].precio
                }
                //mostrar producto (diseño comprar)
                document.getElementById('div-body-tienda-bonus').innerHTML += `<div class="div-producto-tienda"id="id-producto-${productos_tienda[i].id}"><div class="text-bonus-producto">${productos_tienda[i].bonus}</div><div class="text-caducidad-bonus-producto"><div class="text-caducidad">Caduca:</div><div class="text-tiempo-caducidad text-tiempo-caducidad-no-activo">${productos_tienda[i].caducidad}</div></div><input class="bt-comprar-producto-bonus bt-comprar-producto-bonus-no-activo" type = "button" value = "${precio_producto}" onclick = "comprar_producto_tienda_bonus(${datos_productos})"></div>`
            }
        }
        //actualizar times productos activos
        if (productos_activos.length > 0) {
            interval_actualizacion_time_productos = setTimeout(() => {
                console.log('interval')
                productos_activos.forEach(productos => {
                    console.log(productos.id)
                    const tiempo_restante = productos.caduca.replaceAll('h', '') - new Date()
                    const horas_restantes = Math.trunc(tiempo_restante / 3600000)
                    const minutos_restantes = Math.ceil((tiempo_restante % 3600000) / 60000)
                    let tiempo_mostrar = horas_restantes.toLocaleString()
                    if (minutos_restantes > 1) {
                        tiempo_mostrar = horas_restantes.toLocaleString() + ',' + minutos_restantes
                    }
                    $(`#id-producto-${datos_producto.id}`).find('.text-tiempo-caducidad').innerHTML = tiempo_mostrar
                })
            }, 1000)
        }
    }
    function comprar_producto_tienda_bonus(datos_producto) {
        if (datos_producto.precio <= Number(get_dinero_jugador())) {
            $(`#id-producto-${datos_producto.id}`).find('input[type="button"]').click()
            //actualizar lista
            let lista_bonus_actual = JSON.parse(get_bonus_multiplicador_jugador())

            let tiempo_caducidad = datos_producto.caducidad;
            if (datos_producto.caducidad[datos_producto.caducidad.length - 1] === 'h') {
                const time = tiempo_caducidad.splice('.')
                tiempo_caducidad = new Date() + time[0] * 60 * 60 * 1000
                if (time.length == 2) {
                    tiempo_caducidad += time[1] * 60 * 100
                }
                tiempo_caducidad += 'h'
                const producto_guardar = {
                    id: datos_producto.id,
                    bonus: datos_producto.bonus,
                    caduca: tiempo_caducidad
                }
                lista_bonus_actual.bonus_temporal_fecha.push(producto_guardar)
                localStorage.setItem('lista_bonus_multiplicador_jugador', JSON.stringify(lista_bonus_actual))
            }
            else if (datos_producto.caducidad === 'ad') {//ver anuncio
                const producto_guardar = {
                    id: datos_producto.id,
                    bonus: datos_producto.bonus,
                    caduca: tiempo_caducidad
                }
                lista_bonus_actual.bonus_numero_partidas.push(producto_guardar)
                localStorage.setItem('lista_bonus_multiplicador_jugador', JSON.stringify(lista_bonus_actual))
            }
            else {
                const producto_guardar = {
                    id: datos_producto.id,
                    bonus: datos_producto.bonus,
                    caduca: tiempo_caducidad
                }
                lista_bonus_actual.bonus_numero_partidas.push(producto_guardar)
                localStorage.setItem('lista_bonus_multiplicador_jugador', JSON.stringify(lista_bonus_actual))
            }
            //actualizar pantalla (cambiar estilos producto; comprar-->activo)
            $(`#id-producto-${datos_producto.id}`).find('input[type="button"]').toggleClass('bt-comprar-producto-bonus-no-activo bt-comprar-producto-bonus-activo')
            if (datos_producto.caducidad !== 'ad') {
                actualizar_dinero(-datos_producto.precio, `- ${datos_producto}`, 'Compras')
            }
        }
    }

    function abrir_tienda() {
        if (AbrirTienda_permitido) {
            mostrar_tienda()
            actualizar_productos_tienda_bonus()
            mostrar_tienda_bonus()
        }
    }
    function cerrar_tienda() {
        clearInterval(interval_actualizacion_time_productos)
        esconder_tienda()
    }
}
//historial
{
    function abrir_historial() {
        actualizar_historial()
        mostrar_historial()
    }
    function actualizar_historial() {
        let datos_historial = [
            [{
                fecha: '1-12-2023', operaciones: [
                    { dinero_final: 125, operaciones: [{ dinero: + 15, accion: '+ 15 * 1.2' }] },
                    {
                        dinero_final: 125, operaciones: [
                            { dinero: - 15, accion: 'Boletos' },
                            { dinero: - 20, accion: 'Boletos' }
                        ]
                    },
                    {
                        dinero_final: 125, operaciones: [
                            { dinero: - 15, accion: 'Compras' },
                            { dinero: - 20, accion: 'Compras' }
                        ]
                    }
                ], dinero_final: 155
            }]
        ]
    }
}
//animaciones
{
    function mostrar_cambio_dinero() {
        document.getElementById("div-dinero-sumar").style.top = '40px'
        document.getElementById("div-dinero-sumar").style.opacity = '0'
        $('#div-dinero-sumar').animate({ top: '56px', opacity: 1 }, 350);
        $('#div-dinero-sumar').animate({ top: '48px' }, 125);
    }
    function esconder_cambio_dinero() {
        $('#div-dinero-sumar').animate({ top: '40px', opacity: 0 }, 225);
    }

    function vaciar_lista_boletos_comprados() {
        const time = 1225
        $('.boleto-conseguido').animate({ opacity: 0 }, time);
        setTimeout(() => {
            document.getElementById("boletos-comprados-div").innerHTML = ''
        }, time)
    }

    function animacion_resultado_partida() {
        const img = 'img-titulo-fin-partida'
        document.getElementsByClassName(img)[0].style.transform = 'scale(0.3)'
        document.getElementsByClassName(img)[0].style.opacity = '0'
        document.getElementById("titulo-fin-partida").style.display = 'flex'

        $(`.${img}`).animate({ opacity: 1, scale: '1.3' }, {
            duration: 750,
            progress: function (animation, progress) {
                let currentScale = 1 + (0.3 * progress);
                $(`.${img}`).css('transform', 'scale(' + currentScale + ')');
            },
            complete: function () {
                setTimeout(() => {
                    $(`.${img}`).animate({ opacity: 0 }, 300);
                }, 2700)
            }
        });
    }

    function mostrar_menu_boletos() {
        $('.div-abrir-cerrar-menu-boletos-cerrado').toggleClass('div-abrir-cerrar-menu-boletos-cerrado div-abrir-cerrar-menu-boletos-abierto')
        $('.menu-boletos-comprados-cerrado').toggleClass('menu-boletos-comprados-cerrado menu-boletos-comprados-abierto')
    }
    function esconder_menu_boletos() {
        $('.div-abrir-cerrar-menu-boletos-abierto').toggleClass('div-abrir-cerrar-menu-boletos-abierto div-abrir-cerrar-menu-boletos-cerrado')
        $('.menu-boletos-comprados-abierto').toggleClass('menu-boletos-comprados-abierto menu-boletos-comprados-cerrado')
    }

    function mostrar_tienda() {
        $('#div-tienda').css('display', 'block');
        $('#div-tienda').animate({ opacity: 1 }, 450)
    }
    function esconder_tienda() {
        
        $('#div-tienda').animate({ opacity: 0 }, 250, function () {
            setTimeout(() => {
                $('#div-tienda').css('display', 'none');
            }, 1000)
        });
    }

    function mostrar_tienda_bonus() {
        $('#div-body-tienda-historial').css('display', 'none')
        $('#div-body-tienda-bonus').css('display', 'flex')
    }
    function mostrar_historial() {
        $('#div-body-tienda-bonus').css('display', 'none')
        $('#div-body-tienda-historial').css('display', 'block')
    }
}
//cambiar apuesta
{
    //cambiar apuesta (subir)
    let cambiando_apuesta_subir = false
    document.getElementById("bt-sumar-dinero").addEventListener("click", () => {
        subir_apuesta()
    })
    document.getElementById("bt-sumar-dinero").addEventListener("mousedown", () => {
        cambiando_apuesta_bajar = false
        cambiando_apuesta_subir = true;
        const interval_apuesta = setInterval(() => {
            if (!cambiando_apuesta_subir) {
                clearInterval(interval_apuesta)
            }
            else {
                subir_apuesta()
            }
        }, 200)
    })
    document.getElementById("bt-sumar-dinero").addEventListener("mouseup", () => {
        cambiando_apuesta_subir = false
    })

    function subir_apuesta() {
        const dinero_maximo_apusta = get_dinero_jugador()
        const dinero_apuesta_actual = get_dinero_apuesta_jugador()
        let dinero_subir_apusta = 5;
        if (dinero_apuesta_actual <= 95) {
            dinero_subir_apusta = 5
        }
        if (dinero_apuesta_actual >= 100 && dinero_apuesta_actual <= 990) {
            dinero_subir_apusta = 10
        }
        else if (dinero_apuesta_actual >= 1000 && dinero_apuesta_actual <= 2450) {
            dinero_subir_apusta = 50
        }
        else if (dinero_apuesta_actual >= 2500 && dinero_apuesta_actual <= 9900) {
            dinero_subir_apusta = 100
        }
        else if (dinero_apuesta_actual >= 10000 && dinero_apuesta_actual <= 99000) {
            dinero_subir_apusta = 1000
        }
        else {
            dinero_subir_apusta = 10000
        }

        if ((dinero_apuesta_actual + dinero_subir_apusta) <= dinero_maximo_apusta) {
            localStorage.setItem('dinero_apuesta_usuario', dinero_apuesta_actual + dinero_subir_apusta)
            //actualizar pantalla
            document.getElementById('dinero-apuesta-text').value = dinero_apuesta_actual + dinero_subir_apusta
            actualizar_apuesta()
        }
        else {
            cambiando_apuesta_subir = false
        }
    }
    //cambiar apuesta (bajar)
    let cambiando_apuesta_bajar = false
    document.getElementById("bt-restar-dinero").addEventListener("click", () => {

        bajar_apuesta()
    })
    document.getElementById("bt-restar-dinero").addEventListener("mousedown", () => {
        cambiando_apuesta_subir = false
        cambiando_apuesta_bajar = true;
        const interval_apuesta = setInterval(() => {
            if (!cambiando_apuesta_bajar) {
                clearInterval(interval_apuesta)
            }
            else {
                bajar_apuesta()
            }
        }, 200)
    })
    document.getElementById("bt-restar-dinero").addEventListener("mouseup", () => {
        cambiando_apuesta_bajar = false
    })

    function bajar_apuesta() {
        const dinero_minimo_apusta = 5
        const dinero_apuesta_actual = get_dinero_apuesta_jugador()
        let dinero_bajar_apusta;
        if (dinero_apuesta_actual <= 95) {
            dinero_bajar_apusta = 5
        }
        if (dinero_apuesta_actual >= 100 && dinero_apuesta_actual <= 990) {
            dinero_bajar_apusta = 10
        }
        else if (dinero_apuesta_actual >= 1000 && dinero_apuesta_actual <= 2450) {
            dinero_bajar_apusta = 50
        }
        else if (dinero_apuesta_actual >= 2500 && dinero_apuesta_actual <= 9900) {
            dinero_bajar_apusta = 100
        }
        else if (dinero_apuesta_actual >= 10000 && dinero_apuesta_actual <= 99000) {
            dinero_bajar_apusta = 1000
        }
        else {
            dinero_bajar_apusta = 10000
        }
        if ((dinero_apuesta_actual - dinero_bajar_apusta) >= dinero_minimo_apusta) {
            localStorage.setItem('dinero_apuesta_usuario', dinero_apuesta_actual - dinero_bajar_apusta)
            //actualizar pantalla
            document.getElementById('dinero-apuesta-text').value = dinero_apuesta_actual - dinero_bajar_apusta
            actualizar_apuesta()
        }
        else {
            cambiando_apuesta_bajar = false
        }
    }
    //actualizar pantalla
    function actualizar_apuesta() {
        const dinero_apuesta = get_dinero_apuesta_jugador()
        const dinero_jugador = get_dinero_jugador()
        if (dinero_apuesta <= dinero_jugador) {
            document.getElementById("dinero-apuesta-text").innerHTML = dinero_apuesta.toLocaleString()
        }
        else {
            set_apuesta_jugador(dinero_jugador)
            document.getElementById("dinero-apuesta-text").innerHTML = dinero_jugador
        }

    }
}
//gets
{
    function get_dinero_jugador() {
        const dinero_minimo = 250
        let dinero_devolver = dinero_minimo
        fetch('http://127.0.0.1:5500/base_datos_local/datos_jugador.json')
            .then((res) => {
                return res.json()
            })
            .then((data) => {
                const dinero_jugador = Number(data.dinero_jugador)
                if (!isNaN(Number(dinero_jugador)) && (dinero_jugador >= 0)) {
                    dinero_devolver = dinero_jugador
                }
                else {
                    dinero_devolver = dinero_minimo
                }
            })
            .catch(() => {
                dinero_devolver = dinero_minimo
            })
        return dinero_devolver
    }
    function get_dinero_apuesta_jugador() {
        const dinero_apuesta_minima = 5
        let dinero_apuesta_dedvolver = dinero_apuesta_minima
        fetch('http://127.0.0.1:5500/base_datos_local/datos_jugador.json')
            .then((res) => {
                return res.json()
            })
            .then((data) => {
                const dinero_apuesta = data.dinero_apuesta
                if (!isNaN(Number(dinero_apuesta)) && (dinero_apuesta >= dinero_apuesta_minima)) {
                    dinero_apuesta_dedvolver = dinero_apuesta
                }
                else {
                    dinero_apuesta_dedvolver = dinero_apuesta_minima
                }
            })
            .catch(() => {
                dinero_apuesta_dedvolver = dinero_apuesta_minima
            })
        return dinero_apuesta_dedvolver
    }
    async function get_bonus_multiplicador_jugador() {
        let historial_bonus_multiplicador_jugador;
        const res = await fetch('http://127.0.0.1:5500/base_datos_local/datos_jugador.json')
            .then((res) => {
                return res.json()
            })
            .then((data) => {
                let historial_bonus = data.historial_bonus_multiplicador
                if (historial_bonus.length > 0) {
                    //filtrar caducados
                    historial_bonus_multiplicador_jugador = historial_bonus.filter((bonus) => {

                        let number = ""
                        const numero_eliminar = (bonus.caducidad[bonus.caducidad.length - 1] === 'h') ? 2 : 3
                        console.log(numero_eliminar)
                        for (let i = bonus.caducidad.length - numero_eliminar; i >= 0; i--) {
                            number = bonus.caducidad[i] + number
                        }
                        return Number(number) > 0
                    })
                }
                console.log(historial_bonus)
            })

        return [...historial_bonus_multiplicador_jugador]


    }
    function get_experiencia_jugador() {
        const experiencia_jugador_minima = 0
        let experiencia_jugador_devolver = experiencia_jugador_minima
        fetch('http://127.0.0.1:5500/base_datos_local/datos_jugador.json')
            .then((res) => {
                return res.json()
            })
            .then((data) => {
                const experiencia_jugador = data.experiencia
                if (experiencia_jugador < experiencia_jugador_minima) {
                    experiencia_jugador_devolver = experiencia_jugador_minima
                }
                else {
                    experiencia_jugador_devolver = experiencia_jugador
                }
            })
            .catch(() => {
                experiencia_jugador_devolver = experiencia_jugador_minima
            })

        return experiencia_jugador_devolver
    }
    function get_nivel_jugador() {
        const nivel_jugador_minimo = 1
        let nivel_jugador_devolver = nivel_jugador_minimo
        fetch('http://127.0.0.1:5500/base_datos_local/datos_jugador.json')
            .then((res) => {
                return res.json()
            })
            .then((data) => {
                const nivel_jugador = data.nivel
                if (nivel_jugador < nivel_jugador_minimo) {
                    nivel_jugador_devolver = nivel_jugador_minimo
                }
                else {
                    nivel_jugador_devolver = nivel_jugador
                }
            })
            .catch(() => {
                nivel_jugador_devolver = nivel_jugador_minimo
            })

        return nivel_jugador_devolver
    }
}
//sets
{
    function set_dinero_jugador(dinero_cambiar) {

    }
    function set_apuesta_jugador(dinero_cambiar) {

    }
}