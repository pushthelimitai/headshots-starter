import {Database} from "@/types/supabase";
import {createRouteHandlerClient} from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";

const astriaApiKey = process.env.ASTRIA_API_KEY;
const astriaTestModeIsOn = process.env.ASTRIA_TEST_MODE === "true";
const packsIsEnabled = process.env.NEXT_PUBLIC_TUNE_TYPE === "packs";
// For local development, recommend using an Ngrok tunnel for the domain

const appWebhookSecret = process.env.APP_WEBHOOK_SECRET;
//const stripeIsConfigured = process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === "true";

if (!appWebhookSecret) {
    throw new Error("MISSING APP_WEBHOOK_SECRET!");
}

export async function POST(request: Request) {
    const payload = await request.json();
    // const images = payload.urls;
    const images = ['https://fwcjrt6rpdchy9vv.public.blob.vercel-storage.com/photo_2025-01-03_00-04-46-5fY29EPCkWhdDTyj1FULKDFX96asjW.jpg',
        'https://fwcjrt6rpdchy9vv.public.blob.vercel-storage.com/photo_2025-01-03_00-20-01-wWd8yTgUsZrEctM5CNFUMSx75UWQBu.jpg',
        'https://fwcjrt6rpdchy9vv.public.blob.vercel-storage.com/photo_2025-01-03_00-20-04-B9oJ8FPgxYFsfCWWYlI6xVBK7WKNzz.jpg',
        'https://fwcjrt6rpdchy9vv.public.blob.vercel-storage.com/photo_2025-01-03_00-20-06-B73Q0g4XdV2i8LpwDDHaV2pVBaiaJf.jpg']

    const type = payload.type;
    const pack = payload.pack;
    const name = payload.name;

    const supabase = createRouteHandlerClient<Database>({cookies});

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            {
                message: "Unauthorized",
            },
            {status: 401}
        );
    }

    if (!astriaApiKey) {
        return NextResponse.json(
            {
                message:
                    "Missing API Key: Add your Astria API Key to generate headshots",
            },
            {
                status: 500,
            }
        );
    }

    console.log('images', images)

    if (images?.length < 4) {
        return NextResponse.json(
            {
                message: "Upload at least 4 sample images",
            },
            {status: 500}
        );
    }
    let _credits = null;
    const stripeIsConfigured = "true"
    
    console.log({stripeIsConfigured});
    if (stripeIsConfigured) {
        const {error: creditError, data: credits} = await supabase
            .from("credits")
            .select("credits")
            .eq("user_id", user.id);

        if (creditError) {
            console.error({creditError});
            return NextResponse.json(
                {
                    message: "Something went wrong!",
                },
                {status: 500}
            );
        }

        if (credits.length === 0) {
            // create credits for user.
            const {error: errorCreatingCredits} = await supabase
                .from("credits")
                .insert({
                    user_id: user.id,
                    credits: 0,
                });

            if (errorCreatingCredits) {
                console.error({errorCreatingCredits});
                return NextResponse.json(
                    {
                        message: "Something went wrong!",
                    },
                    {status: 500}
                );
            }

            return NextResponse.json(
                {
                    message:
                        "Not enough credits, please purchase some credits and try again.",
                },
                {status: 500}
            );
        } else if (credits[0]?.credits < 1) {
            return NextResponse.json(
                {
                    message:
                        "Not enough credits, please purchase some credits and try again.",
                },
                {status: 500}
            );
        } else {
            _credits = credits;
        }
    }

    // create a model row in supabase
    const {error: modelError, data, ...params} = await supabase
        .from("models")
        .insert({
            user_id: user.id,
            name,
            type,
        })
        .select("id")
        .single();

    if ((modelError && typeof modelError !== "object") || !data?.id) {
        console.error("modelError: ", modelError);
        return NextResponse.json(
            {
                message: "Something went wrong!",
            },
            {status: 500}
        );
    }

    // Get the modelId from the created model
    const modelId = data?.id;

    try {

        const trainWebhook = `${process.env.VERCEL_URL}/astria/train-webhook`;
        const trainWebhookWithParams = `${trainWebhook}?user_id=${user.id}&model_id=${modelId}&webhook_secret=${appWebhookSecret}`;

        const promptWebhook = `${process.env.VERCEL_URL}/astria/prompt-webhook`;
        const promptWebhookWithParams = `${promptWebhook}?user_id=${user.id}&&model_id=${modelId}&webhook_secret=${appWebhookSecret}`;

        const API_KEY = astriaApiKey;
        const DOMAIN = "https://api.astria.ai";

        // Create a fine tuned model using Astria tune API
        const tuneBody = {
            tune: {
                title: name,
                // Hard coded tune id of Realistic Vision v5.1 from the gallery - https://www.astria.ai/gallery/tunes
                // https://www.astria.ai/gallery/tunes/690204/prompts
                base_tune_id: 690204,
                name: type,
                branch: astriaTestModeIsOn ? "fast" : "sd15",
                token: "ohwx",
                image_urls: images,
                callback: trainWebhookWithParams,
                prompts_attributes: [
                    {
                        text: `portrait of ohwx ${type} wearing a business suit, professional photo, white background, Amazing Details, Best Quality, Masterpiece, dramatic lighting highly detailed, analog photo, overglaze, 80mm Sigma f/1.4 or any ZEISS lens`,
                        callback: promptWebhookWithParams,
                        num_images: 8,
                    },
                    {
                        text: `8k close up linkedin profile picture of ohwx ${type}, professional jack suite, professional headshots, photo-realistic, 4k, high-resolution image, workplace settings, upper body, modern outfit, professional suit, business, blurred background, glass building, office window`,
                        callback: promptWebhookWithParams,
                        num_images: 8,
                    },
                ],
            },
        };

        // Create a fine tuned model using Astria packs API
        const packBody = {
            tune: {
                title: name,
                name: type,
                branch: astriaTestModeIsOn ? "fast" : "sd15",
                callback: trainWebhookWithParams,
                prompt_attributes: {
                    callback: promptWebhookWithParams,
                },
                image_urls: images,
            },
        };

    const response = await axios.post(
      DOMAIN + (packsIsEnabled ? `/p/${pack}/tunes` : "/tunes"),
        packsIsEnabled ? packBody : tuneBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

        const {status} = response;

        // console.log('im here 100', response.status, response.data);

        if (status !== 201) {
            console.error({status});
            // Rollback: Delete the created model if something goes wrong
            if (modelId) {
                await supabase.from("models").delete().eq("id", modelId);
            }

            if (status === 400) {
                return NextResponse.json(
                    {
                        message: "webhookUrl must be a URL address",
                    },
                    {status}
                );
            }
            if (status === 402) {
                return NextResponse.json(
                    {
                        message: "Training models is only available on paid plans.",
                    },
                    {status}
                );
            }
        }

    const { error: samplesError } = await supabase.from("samples").insert(
      images.map((sample: string) => ({
        modelId: modelId,
        uri: sample,
      }))
    );

        if (samplesError && typeof samplesError !== "object") {
            console.error("samplesError: ", samplesError);
            return NextResponse.json(
                {
                    message: "Something went wrong!",
                },
                {status: 500}
            );
        }

        if (stripeIsConfigured && _credits && _credits.length > 0) {
            const subtractedCredits = _credits[0].credits - 1;
            const {error: updateCreditError, data} = await supabase
                .from("credits")
                .update({credits: subtractedCredits})
                .eq("user_id", user.id)
                .select("*");

            console.log({data});
            console.log({subtractedCredits});

            if (updateCreditError && typeof updateCreditError !== "object") {
                console.error({updateCreditError});
                return NextResponse.json(
                    {
                        message: "Something went wrong!",
                    },
                    {status: 500}
                );
            }
        }
    } catch (e) {
        if(e instanceof Error){
            console.error(e.message);
        }
        // Rollback: Delete the created model if something goes wrong
        if (modelId) {
            await supabase.from("models").delete().eq("id", modelId);
        }
        return NextResponse.json(
            {
                message: "Something went wrong!",
            },
            {status: 500}
        );
    }

    return NextResponse.json(
        {
            message: "success",
        },
        {status: 200}
    );
}
