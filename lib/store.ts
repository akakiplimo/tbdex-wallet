import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Close, Order, Rfq, TbdexHttpClient } from "@tbdex/http-client";
import { DidDht } from "@web5/dids";
import { Jwt, PresentationExchange } from "@web5/credentials";

// Mock PFI DIDs (same as in the original store)
const mockProviderDids = {
  aquafinance_capital: {
    uri: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
    name: "AquaFinance Capital",
    description:
      "Provides exchanges with the Ghanaian Cedis: GHS to USDC, GHS to KES",
  },
  flowback_financial: {
    uri: "did:dht:zkp5gbsqgzn69b3y5dtt5nnpjtdq6sxyukpzo68npsf79bmtb9zy",
    name: "Flowback Financial",
    description:
      "Offers international rates with various currencies - USD to GBP, GBP to CAD.",
  },
  vertex_liquid_assets: {
    uri: "did:dht:enwguxo8uzqexq14xupe4o9ymxw3nzeb9uug5ijkj9rhfbf1oy5y",
    name: "Vertex Liquid Assets",
    description:
      "Offers currency exchanges between African currencies - MAD to EGP, GHS to NGN.",
  },
  titanium_trust: {
    uri: "did:dht:ozn5c51ruo7z63u1h748ug7rw5p1mq3853ytrd5gatu9a8mm8f1o",
    name: "Titanium Trust",
    description:
      "Provides offerings to exchange USD to African currencies - USD to GHS, USD to KES.",
  },
  // TODO 11: Surprise surprise.
};

const useStore = create(
  persist(
    (set, get) => ({
      balance: 100,
      transactions: [1, 2, 3],
      transactionsLoading: false,
      pfiAllowlist: Object.keys(mockProviderDids).map((key) => ({
        pfiUri: mockProviderDids[key].uri,
        pfiName: mockProviderDids[key].name,
        pfiDescription: mockProviderDids[key].description,
      })),
      selectedTransaction: null,
      offering: null,
      payinCurrencies: [],
      payoutCurrencies: [],
      offerings: [],
      customerDid: null,
      customerCredentials: [],

      initializeDid: async () => {
        try {
          const storedDid = localStorage.getItem("customerDid");
          if (storedDid) {
            const customerDid = await DidDht.import({
              portableDid: JSON.parse(storedDid),
            });
            set({ customerDid });
          } else {
            const customerDid = await DidDht.create({
              options: { publish: true },
            });
            const exportedDid = await customerDid.export();
            localStorage.setItem("customerDid", JSON.stringify(exportedDid));
            set({ customerDid });
          }
        } catch (error) {
          console.error("Failed to initialize DID:", error);
        }
      },

      fetchOfferings: async () => {
        try {
          const allOfferings = [];
          for (const pfi of get().pfiAllowlist) {
            const pfiUri = pfi.pfiUri;
            const offerings = await TbdexHttpClient.getOfferings({
              pfiDid: pfiUri,
            });
            allOfferings.push(...offerings);
          }
          set({ offerings: allOfferings });
          get().updateCurrencies();
        } catch (error) {
          console.error("Failed to fetch offerings:", error);
        }
      },

      createExchange: async (offering, amount, payoutPaymentDetails) => {
        const selectedCredentials = PresentationExchange.selectCredentials({
          vcJwts: get().customerCredentials,
          presentationDefinition: offering.data.requiredClaims,
        });

        const rfq = Rfq.create({
          metadata: {
            from: get().customerDid.uri,
            to: offering.metadata.from,
            protocol: "1.0",
          },
          data: {
            offeringId: offering.id,
            payin: {
              amount: amount.toString(),
              kind: offering.data.payin.methods[0].kind,
              paymentDetails: {},
            },
            payout: {
              kind: offering.data.payout.methods[0].kind,
              paymentDetails: payoutPaymentDetails,
            },
            claims: selectedCredentials,
          },
        });

        try {
          await rfq.verifyOfferingRequirements(offering);
        } catch (e) {
          console.log("Offering requirements not met", e);
          return;
        }

        await rfq.sign(get().customerDid);

        try {
          await TbdexHttpClient.createExchange(rfq);
        } catch (error) {
          console.error("Failed to create exchange:", error);
        }
      },

      fetchExchanges: async (pfiUri) => {
        try {
          const exchanges = await TbdexHttpClient.getExchanges({
            pfiDid: pfiUri,
            did: get().customerDid,
          });

          return get().formatMessages(exchanges);
        } catch (error) {
          console.error("Failed to fetch exchanges:", error);
        }
      },

      addClose: async (exchangeId, pfiUri, reason) => {
        const close = Close.create({
          metadata: {
            from: get().customerDid.uri,
            to: pfiUri,
            exchangeId,
            protocol: "1.0",
          },
          data: {
            reason,
          },
        });

        try {
          await close.sign(get().customerDid);
          await TbdexHttpClient.submitClose(close);
        } catch (error) {
          console.error("Failed to close exchange:", error);
        }
      },

      addOrder: async (exchangeId, pfiUri) => {
        const order = Order.create({
          metadata: {
            from: get().customerDid.uri,
            to: pfiUri,
            exchangeId,
            protocol: "1.0",
          },
        });

        try {
          await order.sign(get().customerDid);
          await TbdexHttpClient.submitOrder(order);
        } catch (error) {
          console.error("Failed to submit order:", error);
        }
      },

      pollExchanges: () => {
        const fetchAllExchanges = async () => {
          console.log("Polling exchanges again...");
          if (!get().customerDid) return;
          const allExchanges = [];
          try {
            for (const pfi of get().pfiAllowlist) {
              const exchanges = await get().fetchExchanges(pfi.pfiUri);
              allExchanges.push(...exchanges);
            }
            console.log("All exchanges:", allExchanges);
            get().updateExchanges(allExchanges.reverse());
            set({ transactionsLoading: false });
          } catch (error) {
            console.error("Failed to fetch exchanges:", error);
          }
        };

        fetchAllExchanges();
        setInterval(fetchAllExchanges, 5000);
      },

      // ... (include other methods like formatMessages, updateExchanges, etc.)

      addCredential: (credential) => {
        set((state) => ({
          customerCredentials: [...state.customerCredentials, credential],
        }));
        localStorage.setItem(
          "customerCredentials",
          JSON.stringify(get().customerCredentials)
        );
      },

      renderCredential: (credentialJwt) => {
        const vc = Jwt.parse({ jwt: credentialJwt }).decoded.payload["vc"];
        return {
          title: vc.type[vc.type.length - 1].replace(
            /(?<!^)(?<![A-Z])[A-Z](?=[a-z])/g,
            " $&"
          ),
          name: vc.credentialSubject["name"],
          countryCode: vc.credentialSubject["countryOfResidence"],
          issuanceDate: new Date(vc.issuanceDate).toLocaleDateString(
            undefined,
            { dateStyle: "medium" }
          ),
        };
      },

      // ... (include other utility methods)
    }),
    {
      name: "wallet-storage",
      getStorage: () => localStorage,
    }
  )
);

export default useStore;
