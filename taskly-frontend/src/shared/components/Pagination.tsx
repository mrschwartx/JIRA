import { Button, Flex, Text } from '@chakra-ui/react'
import { BsChevronDoubleLeft, BsChevronDoubleRight, BsChevronLeft, BsChevronRight } from 'react-icons/bs'

type PaginationProps = {
  itemCount: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ itemCount, pageSize, currentPage, onPageChange }: PaginationProps) {
  const pageCount = Math.ceil(itemCount / pageSize)

  if (pageCount <= 1) {
    return null
  }

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= pageCount

  return (
    <Flex align="center" gap="2" mt="2">
      <Text fontSize="sm">
        Page {currentPage} of {pageCount}
      </Text>
      <Button aria-label="First page" disabled={isFirstPage} onClick={() => onPageChange(1)}>
        <BsChevronDoubleLeft />
      </Button>
      <Button aria-label="Previous page" disabled={isFirstPage} onClick={() => onPageChange(currentPage - 1)}>
        <BsChevronLeft />
      </Button>
      <Button aria-label="Next page" disabled={isLastPage} onClick={() => onPageChange(currentPage + 1)}>
        <BsChevronRight />
      </Button>
      <Button aria-label="Last page" disabled={isLastPage} onClick={() => onPageChange(pageCount)}>
        <BsChevronDoubleRight />
      </Button>
    </Flex>
  )
}
