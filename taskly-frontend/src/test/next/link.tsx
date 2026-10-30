import type { AnchorHTMLAttributes, MouseEvent, Ref } from 'react'
import { memoryNavigation } from './navigation'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
  ref?: Ref<HTMLAnchorElement>
}

export default function Link({ href, prefetch, replace, scroll, onClick, ref, ...rest }: LinkProps) {
  void prefetch
  void scroll

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    if (replace) {
      memoryNavigation.replace(href)
    } else {
      memoryNavigation.push(href)
    }
  }

  return <a ref={ref} href={href} onClick={handleClick} {...rest} />
}
