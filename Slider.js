export default class Slider {
  constructor({
    track, //Dom элемент (тип: object)
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
  }) {
    /* Методы которые можно юзать:
      init(resize = 1); // добавление событий, классов на элементах (запуск без параметров запускает controlResize, запуск с 0 запускает все события кроме controlResize)
      destroy(resize = 1); // удаление событий и классов на элементах (запуск без параметров запускает stopControlResize, запуск с 0 удаляет все события кроме stopControlResize)
      autoPlay(stop); если вызов с параметром равном true то выключить иначе включить
      toggleClass(elem, cmd = "add", nameClass = "active") elem: Dom элемент, комманды: "add" и "remove", nameClass: по умолчанию "active" 
      slide(cmd) // доступные команды: index: номер слайда от 0, "next", "prev", "slide": без переключения слайда сделать трансформацию
      controlResize() // вешает событие resize (внутри вызывает mediaFunc) на window при создании сразу вызывает mediaFunc
      stopControlResize() // удаляет событие resize (внутри вызывает mediaFunc) на window 
      setMargin(nmb) //принимает число, изменяет текущее свойство margin-right на слайдах (пока только в px)
      Свойства:
      mediaFunc, // принимает тело функции, принимает в аргумент ширину родителя track-а (тип: function)
      */
    if (!(typeof track === "object" && track?.offsetWidth))
      throw "track не был задан";
    if (!track.querySelector(".slide"))
      throw "класса .slide внутри track не задано";
    if (buttons && !(typeof buttons === "object" && buttons?.offsetWidth))
      throw "Элемент buttons был задан не правильно";
    if (dots && !(typeof dots === "object" && dots?.offsetWidth))
      throw "Элемент dots был задан не правильно";
    if (!(typeof transition === "string"))
      throw "transition должен быть строкой";

    this.track = track;
    this.parentTrack = track.parentElement;
    this.threshold = threshold ?? 0.2;
    this.slides = track.querySelectorAll(".slide");
    this.width = track.querySelector(".slide").offsetWidth;
    this.infinity = infinity ? 1 : 0;
    this.showSlide = +showSlide || 1;
    this.buttons = buttons && {
      wrap: buttons,
      prev: buttons.querySelectorAll(".prev"),
      next: buttons.querySelectorAll(".next")
    };
    this.dots = dots && dots.querySelectorAll(".dot");
    this.transition = transition.toString();
    this.active = start > 0 ? +start : 0;
    this.margin = +margin || 0;
    this.overflow = overflow ? 1 : 0;
    // this.mediaFunc = () => {};
    this.interval = interval > 10 ? +interval : 4000;
    this.autoplay = autoplay > 0 ? 1 : 0;
    this.stopAutoPlay = null;
    this.callbackSwipe = e => this.swipeStart(e);
    this.callbackBtnsPrev = () => this.slide("prev");
    this.callbackBtnsNext = () => this.slide("next");
    this.callbackDots = index => {
      if (this.infinity) {
        this.slide(index + 1);
      } else {
        this.slide(index);
      }
    };
    this.callbackMouseenterParentTrack = () => this.autoPlay(1);
    this.callbackMouseleaveParentTrack = () => {
      if (this.autoplay && !this.allowSwipe) this.autoPlay();
    };
    this.callbackTransitionend = () => {
      if (this.infinity) {
        this.toggleClass(this.slides[this.active], "remove");
        this.track.style.transition = "0s transform linear";
        if (this.active == 0) {
          this.active = this.slides.length - 2;
          this.transform();
        } else if (this.active == this.slides.length - 1) {
          this.active = 1;
          this.transform();
        }
        this.toggleClass(this.slides[this.active], "add");
      }
      this.allowSwipe = 0;
    };
    this.callbackResize = () => {
      this.infinity ? this.slide(1) : this.slide(0);
      this.media(window.innerWidth);
    };
  }

  init(resize = 1) {
    try {
      if (resize) this.controlResize();
      if (this.infinity) {
        this.active = this.active == 0 ? this.active + 1 : this.active;
        const firstCloned = this.slides[0].cloneNode(true);
        const lastCloned = this.slides[this.slides.length - 1].cloneNode(true);
        this.toggleClass(firstCloned, "add", "cloned");
        this.toggleClass(lastCloned, "add", "cloned");
        this.track.prepend(lastCloned);
        this.track.append(firstCloned);
        this.slides = this.track.querySelectorAll(".slide");
      }

      this.transform();
      this.toggleClass(this.slides[this.active], "add");

      //всяческие дефолтные значения стилей
      if (this.overflow) this.parentTrack.style.overflow = "hidden";
      this.track.style.touchAction = "pan-y";
      this.track.style.userSelect = "none";
      if (this.margin) this.setMargin(this.margin);
      // pointerEvents на img
      // this.slides.forEach(element => {
      //   element.style.pointerEvents = "none";
      // });

      //запуск autoPlay
      if (this.autoplay) this.autoPlay();

      // события кнопок
      if (this.buttons) {
        if (this.buttons.prev.length == 0 || this.buttons.next.length == 0)
          throw "Не одной кнопки не найдено";
        this.buttons.prev.forEach(btn => {
          if (this.active == 0) this.toggleClass(btn, "add", "hidden");
          btn.addEventListener("click", this.callbackBtnsPrev);
        });
        this.buttons.next.forEach(btn => {
          if (this.active == this.slides.length - this.showSlide)
            this.toggleClass(btn, "add", "hidden");
          btn.addEventListener("click", this.callbackBtnsNext);
        });
      }

      // события dots
      if (this.dots) {
        if (this.dots.length == 0) throw "Не одного .dot не найдено";
        this.dots.forEach((dot, index) => {
          dot.addEventListener("click", this.callbackDots.bind(this, [index]));
        });
      }

      // события swipe
      this.track.addEventListener("mousedown", this.callbackSwipe);
      this.track.addEventListener("touchstart", this.callbackSwipe);

      //запрещаем swipe до окончания анимации
      this.track.addEventListener("transitionend", this.callbackTransitionend);

      // события вкл/откл autoPlay
      this.parentTrack.addEventListener(
        "mouseenter",
        this.callbackMouseenterParentTrack
      );
      this.parentTrack.addEventListener(
        "mouseleave",
        this.callbackMouseleaveParentTrack
      );
    } catch (e) {
      console.error(e, "start");
    }
  }

  destroy(resize = 1) {
    try {
      if (resize) this.stopControlResize();

      if (this.infinity) {
        //удалить cloned если были
        const cloned = this.track.querySelectorAll(".slide.cloned");
        cloned.forEach(el => el.remove());
      }

      this.transform("destroy");
      this.toggleClass(this.slides[this.active], "remove");

      //всяческие дефолтные значения стилей
      if (this.overflow) this.parentTrack.style.overflow = "";
      this.track.style.touchAction = "";
      this.track.style.userSelect = "";
      if (this.margin) this.setMargin("destroy");

      this.autoPlay(1); // отключение автоплей

      // события кнопок
      if (this.buttons) {
        this.buttons.prev.forEach(btn => {
          this.toggleClass(btn, "remove", "hidden");
          btn.removeEventListener("click", this.callbackBtnsPrev);
        });
        this.buttons.next.forEach(btn => {
          this.toggleClass(btn, "remove", "hidden");
          btn.removeEventListener("click", this.callbackBtnsNext);
        });
      }

      // события dots
      if (this.dots) {
        this.dots.forEach((dot, index) => {
          this.toggleClass(dot, "remove");
          dot.removeEventListener(
            "click",
            this.callbackDots.bind(this, [index])
          );
        });
      }

      // события swipe
      this.track.removeEventListener("mousedown", this.callbackSwipe);
      this.track.removeEventListener("touchstart", this.callbackSwipe);

      //запрещаем swipe до окончания анимации
      this.track.removeEventListener(
        "transitionend",
        this.callbackTransitionend
      );

      // события вкл/откл autoPlay
      this.parentTrack.removeEventListener(
        "mouseenter",
        this.callbackMouseenterParentTrack
      );
      this.parentTrack.removeEventListener(
        "mouseleave",
        this.callbackMouseleaveParentTrack
      );
    } catch (e) {
      console.error(e, "destroy");
    }
  }

  controlResize() {
    try {
      window.addEventListener("resize", this.callbackResize);
      this.media(window.innerWidth);
    } catch (e) {
      console.error(e, "start");
    }
  }

  stopControlResize() {
    try {
      window.removeEventListener("resize", this.callbackResize);
    } catch (e) {
      console.error(e, "stop");
    }
  }

  autoPlay(stop = 0) {
    if (stop) {
      clearInterval(this.stopAutoPlay);
      return (this.stopAutoPlay = null);
    }
    if (this.stopAutoPlay === null) {
      this.stopAutoPlay = setInterval(() => {
        let nextSlide = this.active + this.showSlide;
        let cmd = this.slides?.[nextSlide] ? nextSlide : this.infinity ? 1 : 0;
        this.slide(cmd);
      }, this.interval);
    }
  }

  media(width) {
    if (this.mediaFunc) this.mediaFunc.call(this, width);
  }

  setMargin(nmb) {
    if (+nmb) {
      this.margin = nmb;
      this.slides.forEach(el => (el.style.marginRight = this.margin + "px"));
    } else if (nmb == "destroy") {
      this.slides.forEach(el => (el.style.marginRight = ""));
    } else {
      this.margin = 0;
      this.slides.forEach(el => (el.style.marginRight = ""));
    }
  }

  toggleClass(elem, cmd = "add", nameClass = "active") {
    if (!elem) throw "element не передан в toggleClass";

    if (cmd === "remove") elem.classList.remove(nameClass);
    else elem.classList.add(nameClass);
  }

  slide(cmd) {
    // remove class
    this.toggleClass(this.slides[this.active], "remove");

    // блок dots remove class
    if (this.dots) {
      if (this.infinity) {
        if (this.active === this.slides.length - 1) {
          this.toggleClass(this.dots[0], "remove");
        } else if (this.active === 0) {
          this.toggleClass(this.dots[this.dots.length - 1], "remove");
        } else {
          this.toggleClass(this.dots[this.active - 1], "remove");
        }
      } else {
        this.toggleClass(this.dots[this.active], "remove");
      }
    }

    // команды
    if (cmd === "next") {
      const nextSlide = this.active + this.showSlide;
      if (this.slides?.[nextSlide]) this.active = nextSlide;
    } else if (cmd === "prev") {
      const prevSlide = this.active - this.showSlide;
      if (prevSlide >= 0) this.active = prevSlide;
    } else if (cmd === "slide") {
      //для того чтобы вернуть слайд на место
      this.allowSwipe = 0;
    } else if (this.slides?.[cmd]) {
      this.active = +cmd;
    }

    //toggle class hidden in buttons
    if (this.buttons && !this.infinity) {
      if (this.active == this.slides.length - this.showSlide) {
        this.buttons.prev.forEach(btn =>
          this.toggleClass(btn, "remove", "hidden")
        );
        this.buttons.next.forEach(btn =>
          this.toggleClass(btn, "add", "hidden")
        );
      } else if (this.active == 0) {
        this.buttons.next.forEach(btn =>
          this.toggleClass(btn, "remove", "hidden")
        );
        this.buttons.prev.forEach(btn =>
          this.toggleClass(btn, "add", "hidden")
        );
      } else {
        this.buttons.prev.forEach(btn =>
          this.toggleClass(btn, "remove", "hidden")
        );
        this.buttons.next.forEach(btn =>
          this.toggleClass(btn, "remove", "hidden")
        );
      }
    }

    // блок dots add class
    if (this.dots) {
      if (this.infinity) {
        if (this.active === this.slides.length - 1) {
          this.toggleClass(this.dots[0], "add");
        } else if (this.active === 0) {
          this.toggleClass(this.dots[this.dots.length - 1], "add");
        } else {
          this.toggleClass(this.dots[this.active - 1], "add");
        }
      } else {
        this.toggleClass(this.dots[this.active], "add");
      }
    }

    this.track.style.transition = this.transition;
    this.transform();
    // add class
    this.toggleClass(this.slides[this.active], "add");
  }

  transform(destroy = 0) {
    if (destroy)
      return (this.track.style.transform = `translate3d(0px, 0px, 0px)`);
    this.width = this.track.querySelector(".slide").offsetWidth;
    const transform = -(this.active * this.margin + this.active * this.width);
    this.track.style.transform = `translate3d(${transform}px, 0px, 0px)`;
  }

  swipeStart(e) {
    if (this.allowSwipe) return;
    this.allowSwipe = 1;
    if (e.touches?.[0]) this.autoPlay(1); //отключение autoPlay (для смартфонов)
    const pos = {
      start: 0,
      action: 0,
      end: 0
    };
    const getEvent = e => (e.type.search("touch") !== -1 ? e.touches[0] : e);
    const evt = getEvent(e);

    this.toggleClass(this.track, "add", "grab");

    // убираем плавный переход, чтобы track двигался за курсором без задержки
    // т.к. он будет включается в функции transform()
    this.track.style.transition = "0s transform linear";

    // берем начальную позицию курсора по оси Х
    pos.start = pos.action = evt.clientX;

    const swipeAction = e => {
      const evt = getEvent(e);
      const trfRegExp = /[-0-9.]+(?=px)/;
      // для более красивой записи возьмем в переменную текущее свойство transform
      const style = this.track.style.transform;
      // считываем трансформацию с помощью регулярного выражения и сразу превращаем в число
      let transform = +style.match(trfRegExp)[0];
      pos.action -= evt.clientX;
      this.track.style.transform = `translate3d(${transform -
        pos.action}px, 0px, 0px)`;
      pos.end = pos.action = evt.clientX;
    };

    const swipeEnd = () => {
      const final = Math.abs(pos.start - pos.end);

      // убираем события
      document.removeEventListener("touchmove", swipeAction);
      document.removeEventListener("mousemove", swipeAction);
      document.removeEventListener("touchend", swipeEnd);
      document.removeEventListener("mouseup", swipeEnd);

      this.toggleClass(this.track, "remove", "grab");
      this.track.style.transition = this.transition;

      // сравниваем с порогом сдвига слайда
      if (final > this.width * this.threshold) {
        if (pos.end && pos.start && pos.end !== pos.start) {
          if (pos.end < pos.start) {
            this.slide("next");
          } else {
            this.slide("prev");
          }
        } else {
          this.slide("slide"); // сделать анимацию слайда без переключения
        }
      } else {
        this.slide("slide"); // сделать анимацию слайда без переключения
      }

      if (e.touches?.[0] && this.autoplay) this.autoPlay(); //включение autoPlay (для смартфонов)
    };

    // отслеживаем другие события на документе
    document.addEventListener("touchmove", swipeAction);
    document.addEventListener("touchend", swipeEnd);
    document.addEventListener("mousemove", swipeAction);
    document.addEventListener("mouseup", swipeEnd);
  }
}
