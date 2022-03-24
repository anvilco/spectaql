function toggleMenu () {
  var MOBILE_MENU_SELECTOR = '#spectaql .sidebar-open-button'
  var SIDEBAR_CLOSE_BUTTON_SELECTOR = '#spectaql #sidebar .close-button'
  var PAGE_SELECTOR = '#spectaql #page'
  var MENU_OPEN_CLASS = 'drawer-open'
  var OVERLAY_SELECTOR = '#spectaql .drawer-overlay'

  var mobileButton = document.querySelector(MOBILE_MENU_SELECTOR)
  var sidebarCloseButton = document.querySelector(SIDEBAR_CLOSE_BUTTON_SELECTOR)
  var overlayElement = document.querySelector(OVERLAY_SELECTOR)

  mobileButton.addEventListener('click', handleMobileMenuToggle)
  sidebarCloseButton.addEventListener('click', handleMobileMenuToggle)
  overlayElement.addEventListener('click', handleMobileMenuToggle)

  function handleMobileMenuToggle () {
    var page = document.querySelector(PAGE_SELECTOR)
    var isOpen = page.classList.contains(MENU_OPEN_CLASS)
    if (isOpen) {
      page.classList.remove(MENU_OPEN_CLASS)
    } else {
      page.classList.add(MENU_OPEN_CLASS)
    }
  }
}
