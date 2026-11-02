export const accordionHandler = (event: any) => {
  const accordionParent = event.currentTarget
  const accordionChild = event.currentTarget.nextSibling

  const accordionParentActive = document.querySelector('.accordion-parent.active') as HTMLElement
  const accordionChildActive = document.querySelector('.accordion-child.active') as HTMLElement

  if (accordionParent.classList.contains('active')) {
    accordionParent.classList.remove('active')
    accordionChild.classList.remove('active')
    accordionChild.style.maxHeight = '0px'
  } else {
    // If found another accordion is opened, so close it!
    if (accordionParentActive?.classList.contains('active')) {
      accordionParentActive?.classList.remove('active')
      accordionChildActive.classList.remove('active')
      accordionChildActive.style.maxHeight = '0px'
    }

    accordionParent.classList.add('active')
    accordionChild.classList.add('active')
    accordionChild.style.maxHeight = `${accordionChild.scrollHeight}px`
  }
}
