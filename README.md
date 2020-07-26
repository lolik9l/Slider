# Slider 

Слайдер написанный на чистом js, в основном разрабатывался для Vue js.

Документация:

  Возможные параметры:

  *обязательный параметр

    track, //* Dom элемент (тип: object) каждый слайд внутри должен иметь класс .slide

    start, //стартовать с слайда n (тип: number, принимает: index)

    autoplay, //автоплей слайдера (тип: number, принимает: флаг 0 или 1)

    infinity, //бесконечный ли цикл (тип: number, принимает: флаг 0 или 1)

    showSlide, //сколько слайдов показывать (тип: number)

    buttons, //определяет будут ли кнопки (тип: object, принимает: Dom элемент, контейнер в котором будут элементы с классом .next и .prev)

    dots, //определяет будут ли доты (тип: object, принимает: Dom элемент, контейнер в котором будут элементы с классом .dot )

    interval, //интервал автоплея (тип: number, принимает: число)

    threshold, //порог сдвига слайдера (тип: number floor, принимает: число)

    margin, //отступы между слайдов (тип: number, принимает: размер отступа, пока будет только в px )

    overflow = 1, //нужно ли у родителя добавлять overflow: hidden

    transition = "0.7s transform linear" //анимация слайдера (тип: string, принимает: строку с параметрами)

   Методы которые можно юзать:

      slider.init(resize = 1); // добавление событий, классов на элементах (запуск без параметров запускает controlResize, запуск с 0 запускает все события кроме controlResize)

      slider.destroy(resize = 1); // удаление событий и классов на элементах (запуск без параметров запускает stopControlResize, запуск с 0 удаляет все события кроме     stopControlResize)

      slider.autoPlay(stop); если вызов с параметром равном true то выключить иначе включить

      slider.toggleClass(elem, cmd = "add", nameClass = "active") elem: Dom элемент, комманды: "add" и "remove", nameClass: по умолчанию "active" 

      slider.slide(cmd) // доступные команды: index: номер слайда от 0, "next", "prev", "slide": без переключения слайда сделать трансформацию

      slider.controlResize() // вешает событие resize (внутри вызывает mediaFunc) на window при создании сразу вызывает mediaFunc

      slider.stopControlResize() // удаляет событие resize (внутри вызывает mediaFunc) на window 

      slider.setMargin(nmb) //принимает число, изменяет текущее свойство margin-right на слайдах (пока только в px)

      Свойства:

      slider.mediaFunc = callback(width), // принимает тело функции, принимает в аргумент ширину родителя track-а (тип: function)
 

Применение: 

  Если используете Vue то в хуке mounted используем $refs внутри $nextTick 
  документация:
  https://ru.vuejs.org/v2/guide/reactivity.html#%D0%90%D1%81%D0%B8%D0%BD%D1%85%D1%80%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F-%D0%BE%D1%87%D0%B5%D1%80%D0%B5%D0%B4%D1%8C-%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9

  Пример кода Vue js:
  import Slider from "@/plugins/Slider";

  export default {

    mounted() {

      this.$nextTick(() => {

        this.slider = new Slider({

          track: this.$refs["track"], //Устанавливаем контейнер в котором непосредственно лежат слайды с классом .slide

          dots: this.$refs["dots"], //Устанавливаем контейнер в котором лежат dots внимание каждый элемент который будет точкой должен иметь класс "dot"

          autoplay: 1 //Включаем автоплей

        });

        this.slider.init(); // инициализируем слайдер

      });

    }

  }

  ///////////////////////////////////////////////////////////////////////////

  import Slider from "./Slider";

  const slider = new Slider({

    track: document.getElementById("slider"),

    margin: 50,

    overflow: 0,

    infinity: 1,

    autoplay: 1,

    transition: "1s transform ease-in-out"

  });

  slider.init();

  ///////////////////////////////////////////////////////////////////////////

  import Slider from "./Slider";

  const slider = new Slider({

    track: document.getElementById("slider"),

    buttons: document.getElementById("buttons"),

    transition: "1s transform ease-in-out",

    showSlide: 4,

    margin: 16,

    overflow: 0,

    autoplay: 1,

    threshold: 0.3

  });

  slider.mediaFunc = width => {

    if (width >= 1200) {

      slider.transition = "1s transform ease-in-out";

      slider.showSlide = 4;

      slider.setMargin(16);

    } else {

      slider.transition = "0.5s transform ease-in-out";

      slider.setMargin(32);

      if (width < 576) slider.showSlide = 1;

      else if (width < 992) slider.showSlide = 2;

      else slider.showSlide = 3;

    }

  };

  slider.init();

