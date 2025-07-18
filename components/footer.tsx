import Link from "next/link"

export function Footer() {
  return (
    <footer className="sticky bottom-0 left-0 right-0 bg-white border-t py-3 px-4 text-center text-sm text-gray-600 z-10">
      <div className="container mx-auto">
        Powered by{" "}
        <Link
          href="https://www.botivate.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-800 font-medium"
        >
          Botivate
        </Link>
      </div>
    </footer>
  )
}
