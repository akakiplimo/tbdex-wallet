import React from "react";
import { Button } from "./ui/button";
import useStore from "@/lib/tbdex";
import { useRouter } from "next/navigation";

const LinkPfiOfferings = () => {

    const router = useRouter()

    const {fetchOfferings, offerings} = useStore()

    if(offerings.length > 0) router.push('/')

  return (
    <Button onClick={() => fetchOfferings()} className="plaidlink-primary">
      Connect bank
    </Button>
  );
};

export default LinkPfiOfferings;
