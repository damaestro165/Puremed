import Footer from '@/components/Footer'
import Header from '@/components/Header'
import React from 'react'

type Props = { children: React.ReactNode }

const Layout = ({children}: Props) => {
  return (
    <div>
        <Header />
        <div className="container mx-auto flex-1 p-4">   
            {children}  
        </div>
        <Footer/>
    </div>
  )
}

export default Layout;