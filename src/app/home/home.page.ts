import { Component, signal, computed, inject } from '@angular/core';
import restaurantesJSON from '../../assets/datos/restaurantes.json';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { Restaurante } from '../interface/restaurante';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule],
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage {

  // ############################### REGION DATOS ###############################

  // DONE - Inyectamos el controlador de toasts para mostrar mensajes al usuario
  private toastController = inject(ToastController);

  // Lista completa de restaurantes leída del JSON en tiempo de compilación
  restaurantes: Restaurante[] = restaurantesJSON as Restaurante[];

  // Signal principal con los restaurantes actualmente cargados (vacío hasta que el usuario pulsa "Cargar datos")
  restaurantesCargados = signal<Restaurante[]>([]);

  // DONE - true cuando hay al menos un restaurante cargado.
  // Habrá que usar un computed para controlar si restaurantesCargados tiene elementos o no.
  // Se convierte hayDatos, que era false en la versión de la plantilla (sin computed), 
  // en un computed que devuelve true si restaurantesCargados tiene elementos y false si está vacío. 
  hayDatos = computed(() => this.restaurantesCargados().length > 0);

  // DONE - Carga la lista completa en el signal y muestra un toast de confirmación
  // Usa .set() para meter la lista completa en el signal y avisa al usuario
  cargarDatos() {
    // Cargamos los datos en el signal mediante set()
    this.restaurantesCargados.set(this.restaurantes);
  
    // Mostramos un toast de confirmación con el número de restaurantes cargados
    this.mostrarToast(`${this.restaurantes.length} restaurantes cargados`, 'success');
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
  const toast = await this.toastController.create({
    message: mensaje,
    duration: 2500,
    position: 'bottom',
    color: color
  });
  await toast.present();
}


  // ############################### REGION FILTROS (estado general) ###############################

  textoBusqueda = signal('');

  // ############################### REGION TERRITORIOS ###############################

  // La variable territorioSeleccionado se crea como un signal de tipo string, 
  // inicializado con un string vacío.
  territorioSeleccionado = signal('');

  // DONE - Lista de territorios únicos disponibles, ordenada alfabéticamente
  // Se obtiene a partir de los restaurantes cargados y se usa un computed para recalcularla cuando cambian los datos.
  // PISTA: Mediante map() podemos crear un array de string[] con cada territorio de cada restaurante. Ejemplo: ["Bizkaia", "Gipuzkoa", "Bizkaia", "Araba", "Gipuzkoa"]
  //        Luego mediante Set() podemos eliminar duplicados y finalmente mediante Array.from() podemos volver a convertirlo en un array para devolverlo ordenado alfabéticamente mediante sort().
  // Lista de territorios únicos disponibles ordenada alfabéticamente
  territoriosFiltrados = computed(() => {
    // 1. Extraemos los territorios (filtrando los que tengan valor válido y aplicando trim
    const listaTerritorios = this.restaurantesCargados()
      .filter(r => !!r.territory?.trim())
      .map(r => r.territory!.trim());

    // 2. Eliminamos duplicados con Set y convertimos a Array ordenado alfabéticamente
    return Array.from(new Set(listaTerritorios)).sort();
  });

  // DONE - Actualiza el territorio seleccionado y elimina las localidades que ya no pertenecen a él
  onTerritorioChange(value: string) {

    // Actualizamos el territorio seleccionado
    // Cuando el usuario cambie de territorio en el desplegable,
    // actualizamos el Signal del territorio seleccionado
    
    // "value ?? ''" se lee como: "Usa el valor de value, pero si por alguna razón es
    // vacío, null o undefined (por ejemplo, si el usuario desmarca la opción), 
    // guarda en su lugar un texto vacío, ''".
    this.territorioSeleccionado.set(value ?? '');
    

    // Filtra las localidades ya seleccionadas, quedándose solo con 
    // las que siguen siendo válidas para el nuevo territorio.
    // PISTA: Podemos usar filter() para quedarnos solo con las localidades 
    // que están en la lista de localidades filtradas por territorio y includes() 
    // para comprobar si una localidad está en esa lista.
    // Por ejemplo, si el usuario tenía seleccionadas las localidades ["Bilbao", "Donostia"] 
    // y cambia el territorio a "Araba", la localidad "Bilbao" ya no es válida 
    // y debe eliminarse de la lista de localidades seleccionadas.
    const localidadesValidas = this.localidadesSeleccionadas().filter(loc =>
      this.localidadesFiltradasPorTerritorio().includes(loc)
    );

    // Actualizamos las localidades seleccionadas con las nuevas localidades válidas
    // Actualizamos la variable localidadesSeleccionadas, que es un Signal 
    // que guarda un array de Strings con las localidades seleccionadas por el usuario.
    this.localidadesSeleccionadas.set(localidadesValidas);
  }

  // ############################### REGION LOCALIDADES ###############################

  localidadesSeleccionadas = signal<string[]>([]);

  // DONE - Lista de localidades únicas del territorio seleccionado (o de todos si no hay territorio), ordenada alfabéticamente
  // Se obtiene a partir de los restaurantes cargados y se usa un computed para recalcularla cuando cambian los datos o el territorio seleccionado.
  // PISTA: Haremos uso de la lista de restaurantes, si hay un territorio seleccionado filtraremos por él y luego obtendremos las localidades únicas de los restaurantes restantes, eliminando duplicados y ordenando alfabéticamente.
  localidadesFiltradasPorTerritorio = computed(() => {
    // Obtenemos la lista de restaurantes cargados, siendo lista un array de objetos Restaurante.
    let lista: Restaurante[] = this.restaurantesCargados();

    // Para el territorio la pasaremos a minúsculas y eliminaremos espacios al principio y al final para evitar problemas de coincidencia, mediante toLowerCase() y trim().
    // Obtenemos el territorio en minúsculas y sin espacios
    const territorio = this.territorioSeleccionado().toLowerCase().trim();
  
    // Si hay un territorio seleccionado, filtramos la lista de restaurantes por él
    if (territorio) {
      // Filtramos la lista de restaurantes para quedarnos solo con los que tienen el territorio seleccionado, usando filter() y comparando el territorio del restaurante con el territorio seleccionado.
      lista = lista.filter(r => r.territory?.toLowerCase().trim() === territorio);
    }

    // RESUELTO: Obtenemos la lista de localidades únicas de los restaurantes restantes, eliminando duplicados y ordenando alfabéticamente.
    /* Explicación: locality puede ser undefined, null o un string. Mediante ? de r.locality? le decimos que si es undefined o null no haga nada y devuelva undefined, 
     *              si tiene valor entonces le aplicamos trim() para eliminar espacios al principio y al final.
     *              
     *              !! (doble negación) convierte cualquier valor a boolean. Si locality es undefined, null o un string vacío, !! lo convierte a false. Si tiene valor, !! lo convierte a true.
     *              Por tanto, r => !!r.locality?.trim() devuelve true si locality tiene valor y no es un string vacío, y false en caso contrario. De esta forma filtramos la lista de restaurantes para quedarnos 
     *              solo con los que tienen localidad válida.
     * 
     *              Luego mediante map() obtenemos un array de string[] con las localidades, usando r.locality!.trim() para obtener el valor de locality (el ! le dice a TypeScript que estamos seguros de que no es undefined) 
     *              y aplicando trim() para eliminar espacios al principio y al final.  
     */                  
    const localities = lista.filter(r => !!r.locality?.trim()).map(r => r.locality!.trim());

    //Finalmente mediante Set() eliminamos duplicados y Array.from() lo convertimos de nuevo en un array, que ordenamos alfabéticamente mediante sort(). 
    return Array.from(new Set(localities)).sort();
  });

  // DONE - Actualiza las localidades seleccionadas con los valores del evento
  // Actualiza el Signal localidadesSeleccionadas con el ionChange del html, 
  // que devuelve un array de strings con las localidades seleccionadas por el usuario.
  onLocalidadesChange(value: string[]) {
    // ?? se lee: "Toma el valor de la izquierda (value), pero si es null o undefined, 
    // usa lo de la derecha ([])".
    this.localidadesSeleccionadas.set(value ?? []);
  }

  // ############################### REGION RESULTADOS ###############################

  // TODO - Lista filtrada de restaurantes según todos los filtros activos
  // TEMPORAL: POR AHORA DEVOLVEMOS TODOS LOS RESTAURANTES CARGADOS, SIN FILTRAR
  restaurantesFiltrados = computed(() => {
    return this.restaurantesCargados();
  });
  //restaurantesFiltrados = computed(() => {

    // Obtenemos la lista de restaurantes cargados, siendo lista un array de objetos Restaurante.

    // Filtramos la lista de restaurantes según el texto de búsqueda, el territorio seleccionado y las localidades seleccionadas.
    // PISTA: Habrá que hacer uso de icludes() para comprobar si el texto de búsqueda está en el nombre del restaurante, si el territorio del restaurante coincide con el territorio seleccionado 
    //        y si la localidad del restaurante está en la lista de localidades seleccionadas.
    //        Habrá que hacer uso de filter() para filtrar la lista de restaurantes según cada uno de los filtros activos.

    //textoBusqueda
    
    //territorioSeleccionado
    
    //localidadesSeleccionadas
    
    //Devuelve la lista filtrada de restaurantes
 
  //});


  // ############################### REGION AUXILIARES ###############################

  // Devuelve el número de estrellas Michelin (0 si no tiene o el valor no es numérico).
  // El || 0? se lee como: "Si lo que está a la izquierda (Number(...)) es falso o inválido, 
  // usa lo de la derecha (0)".
  estrellasMichelin(r: Restaurante): number {
    return r.michelinStars ? Number(r.michelinStars) || 0 : 0;
  }

  // Devuelve el número de soles Repsol (0 si no tiene o el valor no es numérico).
  repsolSoles(r: Restaurante): number {
    return r.repsolSoles ? Number(r.repsolSoles) || 0 : 0;
  }
}