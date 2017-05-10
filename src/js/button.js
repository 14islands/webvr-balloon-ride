import * as TweenMax from 'gsap'

export default class Button {

  constructor () {

    this.onContentLoaded = this.onContentLoaded.bind(this)
    this.onBtnHover = this.onBtnHover.bind(this)
    this.onBtnUnhover = this.onBtnUnhover.bind(this)
    this.canRunAnimation = true

    document.addEventListener('DOMContentLoaded', this.onContentLoaded)

  }

  onContentLoaded () {
    this.buttonText = document.getElementById('js-btn-text')
    this.button = document.getElementById('js-btn-fly')
    this.button.addEventListener('mouseover', this.onBtnHover)
    this.button.addEventListener('mouseout', this.onBtnUnhover)
    this.splitText = new SplitText(this.buttonText, {type:"chars"})
  }

  onBtnHover () {
    this.splitText.split({type:"chars, words"})
    this.buttonText.classList.remove('is-inactive')
    if (this.canRunAnimation = true) {
      this.canRunAnimation = false
      console.log(this.canRunAnimation)
      TweenMax.to(this.buttonText, 0.2, {
        autoAlpha: 1
      })
      TweenMax.staggerFrom(this.splitText.chars, 0.3, {
        scale:2,
        autoAlpha:0,
        ease:Back.easeOut,
        onComplete: () => {
          this.canRunAnimation = true
        }
      }, 0.05)
    }
  }

  onBtnUnhover () {
    TweenMax.to(this.buttonText, 0.2, {
      autoAlpha: 0,
      onComplete: () => {
        this.buttonText.classList.add('is-inactive')
      }
    })
  }

}
