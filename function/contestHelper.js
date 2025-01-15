const createContestPipline = (matchStage, skip, pageSize) => {
  return [
    {
      $match: matchStage,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },

    { $skip: skip },
    { $limit: pageSize },
    // { select: "-rankDistribution" },
    {
      $addFields: {
        // Convert subcategoryId to ObjectId or set to null if it's missing or invalid
        subcategoryId: {
          $cond: {
            if: {
              $and: [
                { $eq: [{ $strLenCP: "$subcategoryId" }, 24] },
                { $ne: ["$subcategoryId", ""] },
                { $ne: ["$subcategoryId", null] },
                { $eq: [{ $type: "$subcategoryId" }, "string"] },
              ],
            },
            then: { $toObjectId: "$subcategoryId" },
            else: "",
          },
        },
      },
    },
    {
      $lookup: {
        from: "sub-categories",
        localField: "subcategoryId",
        foreignField: "_id", // Field in SubCategory schema that matches subcategoryId (should be a string)
        as: "subcategory", // The name of the array containing the populated data
        pipeline: [
          {
            $lookup: {
              from: "categories", // Category collection
              localField: "auctioncategory", // Field in SubCategory
              foreignField: "_id", // Field in Category
              as: "auctioncategory", // Populated category field in subcategory
            },
          },
          {
            $unwind: {
              path: "$auctioncategory", // Unwind the category array
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$subcategory",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
};

module.exports = { createContestPipline };
